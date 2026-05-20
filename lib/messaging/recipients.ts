import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AudienceFilter,
  CampaignFilters,
  CampaignRecipient,
} from '@/lib/messaging/types'

function normalizeAudience(filters: CampaignFilters): AudienceFilter {
  if (filters.audience) return filters.audience
  if (filters.recipientType === 'direct' && filters.studentId) return 'direct'
  if (filters.recipientType === 'course' && filters.courseId) return 'students_by_course'
  if (filters.recipientType === 'intake') return 'all_students'
  if (filters.recipientType === 'all') return 'all_students'
  return 'all_students'
}

function dedupeByContact(recipients: CampaignRecipient[]): CampaignRecipient[] {
  const byKey = new Map<string, CampaignRecipient>()
  for (const row of recipients) {
    const key = `${row.email.toLowerCase().trim()}|${row.phone.trim()}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, row)
      continue
    }
    if (!existing.studentId && row.studentId) {
      byKey.set(key, row)
    }
  }
  return [...byKey.values()]
}

function studentRow(row: {
  id: string
  full_name: string
  real_email: string
  phone: string
}): CampaignRecipient {
  return {
    studentId: row.id,
    applicationId: null,
    fullName: row.full_name,
    email: row.real_email,
    phone: row.phone,
  }
}

function applicationRow(row: {
  id: string
  full_name: string
  real_email: string
  phone: string
}): CampaignRecipient {
  return {
    studentId: null,
    applicationId: row.id,
    fullName: row.full_name,
    email: row.real_email,
    phone: row.phone,
  }
}

export async function resolveCampaignRecipients(
  supabase: SupabaseClient,
  filters: CampaignFilters,
): Promise<CampaignRecipient[]> {
  const audience = normalizeAudience(filters)

  if (audience === 'direct' && filters.studentId) {
    const { data } = await supabase
      .from('students')
      .select('id, full_name, real_email, phone')
      .eq('id', filters.studentId)
      .eq('is_active', true)
      .maybeSingle()

    if (!data) return []
    return [studentRow(data)]
  }

  if (audience === 'all_students') {
    const { data } = await supabase
      .from('students')
      .select('id, full_name, real_email, phone')
      .eq('is_active', true)
    return (data ?? []).map(studentRow)
  }

  if (audience === 'students_by_course' && filters.courseId) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, students!inner(id, full_name, real_email, phone, is_active)')
      .eq('course_id', filters.courseId)
      .eq('status', 'active')
    return dedupeStudentsFromEnrollments(enrollments ?? [])
  }

  if (audience === 'students_by_country' && filters.country?.trim()) {
    const { data } = await supabase
      .from('students')
      .select('id, full_name, real_email, phone')
      .eq('is_active', true)
      .ilike('country', filters.country.trim())
    return (data ?? []).map(studentRow)
  }

  if (
    audience === 'students_paid_tuition' ||
    audience === 'students_unpaid_tuition' ||
    audience === 'students_partial_tuition'
  ) {
    const status =
      audience === 'students_paid_tuition'
        ? 'paid'
        : audience === 'students_unpaid_tuition'
          ? 'unpaid'
          : 'partially_paid'

    const { data: invoices } = await supabase
      .from('invoices')
      .select('student_id')
      .eq('type', 'tuition')
      .eq('status', status)
      .not('student_id', 'is', null)

    const studentIds = [
      ...new Set(
        (invoices ?? [])
          .map((inv) => inv.student_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ]

    if (studentIds.length === 0) return []

    const { data: students } = await supabase
      .from('students')
      .select('id, full_name, real_email, phone')
      .in('id', studentIds)
      .eq('is_active', true)

    return (students ?? []).map(studentRow)
  }

  if (audience === 'students_completed') {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, students!inner(id, full_name, real_email, phone, is_active)')
      .eq('status', 'completed')
    return dedupeStudentsFromEnrollments(enrollments ?? [])
  }

  if (audience === 'all_applicants') {
    const { data } = await supabase
      .from('applications')
      .select('id, full_name, real_email, phone')
    return (data ?? []).map(applicationRow)
  }

  if (audience === 'applicants_app_fee_unpaid') {
    const { data } = await supabase
      .from('applications')
      .select('id, full_name, real_email, phone')
      .eq('app_fee_paid', false)
      .neq('status', 'rejected')
    return (data ?? []).map(applicationRow)
  }

  if (audience === 'applicants_app_fee_paid') {
    const { data } = await supabase
      .from('applications')
      .select('id, full_name, real_email, phone')
      .eq('app_fee_paid', true)
    return (data ?? []).map(applicationRow)
  }

  if (
    audience === 'applicants_pending' ||
    audience === 'applicants_shortlisted' ||
    audience === 'applicants_accepted' ||
    audience === 'applicants_rejected' ||
    audience === 'applicants_deferred'
  ) {
    const statusMap: Record<string, string> = {
      applicants_pending: 'pending',
      applicants_shortlisted: 'shortlisted',
      applicants_accepted: 'accepted',
      applicants_rejected: 'rejected',
      applicants_deferred: 'deferred',
    }
    const { data } = await supabase
      .from('applications')
      .select('id, full_name, real_email, phone')
      .eq('status', statusMap[audience])
    return (data ?? []).map(applicationRow)
  }

  if (audience === 'all') {
    const [students, applicants] = await Promise.all([
      resolveCampaignRecipients(supabase, { audience: 'all_students' }),
      resolveCampaignRecipients(supabase, { audience: 'all_applicants' }),
    ])
    return dedupeByContact([...students, ...applicants])
  }

  return []
}

function dedupeStudentsFromEnrollments(
  enrollments: {
    student_id: string
    students:
      | {
          id: string
          full_name: string
          real_email: string
          phone: string
          is_active: boolean
        }
      | {
          id: string
          full_name: string
          real_email: string
          phone: string
          is_active: boolean
        }[]
      | null
  }[],
): CampaignRecipient[] {
  const byId = new Map<string, CampaignRecipient>()

  for (const row of enrollments) {
    const student = Array.isArray(row.students) ? row.students[0] : row.students
    if (!student?.is_active) continue
    byId.set(student.id, studentRow(student))
  }

  return [...byId.values()]
}
