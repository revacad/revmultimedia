import type { SupabaseClient } from '@supabase/supabase-js'
import type { CampaignFilters, CampaignRecipient } from '@/lib/messaging/types'

export async function resolveCampaignRecipients(
  supabase: SupabaseClient,
  filters: CampaignFilters,
): Promise<CampaignRecipient[]> {
  if (filters.recipientType === 'direct' && filters.studentId) {
    const { data } = await supabase
      .from('students')
      .select('id, full_name, real_email, phone')
      .eq('id', filters.studentId)
      .eq('is_active', true)
      .maybeSingle()

    if (!data) return []
    return [
      {
        studentId: data.id,
        fullName: data.full_name,
        email: data.real_email,
        phone: data.phone,
      },
    ]
  }

  if (filters.recipientType === 'course' && filters.courseId) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, students!inner(id, full_name, real_email, phone, is_active)')
      .eq('course_id', filters.courseId)
      .eq('status', 'active')

    return dedupeRecipients(enrollments ?? [])
  }

  if (filters.recipientType === 'intake' && filters.intakeId) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, students!inner(id, full_name, real_email, phone, is_active)')
      .eq('intake_id', filters.intakeId)
      .eq('status', 'active')

    return dedupeRecipients(enrollments ?? [])
  }

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, real_email, phone')
    .eq('is_active', true)

  return (students ?? []).map((row) => ({
    studentId: row.id,
    fullName: row.full_name,
    email: row.real_email,
    phone: row.phone,
  }))
}

function dedupeRecipients(
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
    byId.set(student.id, {
      studentId: student.id,
      fullName: student.full_name,
      email: student.real_email,
      phone: student.phone,
    })
  }

  return [...byId.values()]
}
