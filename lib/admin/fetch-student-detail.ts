import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminStudentDetail } from '@/components/admin/students/StudentDetailView'
import type { ApplicationStatus } from '@/lib/applications/types'
import {
  deriveProgramLifecycleStatus,
  PROGRAM_STATUS_LABELS,
  sumTuitionPaidFromInvoices,
} from '@/lib/enrollment/program-status'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function fetchAdminStudentDetail(
  supabase: SupabaseClient,
  studentId: string,
): Promise<{ detail: AdminStudentDetail } | { error: string }> {
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(
      `
      *,
      applications!application_id(reference),
      enrollments(
        id,
        status,
        courses(id, title, slug, category),
        intakes(name, start_date, end_date)
      )
    `,
    )
    .eq('id', studentId)
    .maybeSingle()

  if (studentError) {
    console.error('[admin/students/detail] student fetch failed', studentError)
    return { error: studentError.message }
  }

  if (!student) {
    return { error: 'Student not found' }
  }

  const applicationIds: string[] = [student.application_id]
  let applicationRows: AdminStudentDetail['allApplications'] = []

  if (student.auth_user_id) {
    const { data: apps } = await supabase
      .from('applications')
      .select(
        `
        id, reference, status, created_at, enrolled_at, admission_letter_sent_at,
        courses(title),
        invoices(type, status, total_ghs, installments(amount_ghs))
      `,
      )
      .eq('auth_user_id', student.auth_user_id)
      .order('created_at', { ascending: false })

    const applicationIdsFromApps = (apps ?? []).map((row) => row.id)
    for (const appId of applicationIdsFromApps) {
      if (!applicationIds.includes(appId)) {
        applicationIds.push(appId)
      }
    }

    const { data: studentsForApps } = await supabase
      .from('students')
      .select('application_id')
      .in('application_id', applicationIdsFromApps.length ? applicationIdsFromApps : [student.application_id])

    const studentRecordByApplication = new Set(
      (studentsForApps ?? []).map((row) => row.application_id),
    )

    applicationRows = (apps ?? []).map((row) => {
      const invoices = (row.invoices as {
        type: string
        status: string
        total_ghs: number
        installments?: { amount_ghs: number }[] | null
      }[]) ?? []

      const { tuitionPaidGhs, tuitionInvoiceStatus } = sumTuitionPaidFromInvoices(invoices)
      const tuitionInvoice = invoices.find((inv) => inv.type === 'tuition')
      const effectiveTuitionPaid =
        tuitionPaidGhs > 0
          ? tuitionPaidGhs
          : tuitionInvoice?.status === 'paid'
            ? Number(tuitionInvoice.total_ghs ?? 0)
            : 0

      const lifecycle = deriveProgramLifecycleStatus({
        registeredAt: row.created_at,
        enrolledAt: row.enrolled_at as string | null,
        tuitionPaidGhs: effectiveTuitionPaid,
        tuitionInvoiceStatus,
        hasStudentRecord: studentRecordByApplication.has(row.id),
      })

      return {
        id: row.id,
        reference: row.reference,
        status: row.status as ApplicationStatus,
        created_at: row.created_at,
        enrolled_at: row.enrolled_at as string | null,
        admission_letter_sent_at: row.admission_letter_sent_at as string | null,
        lifecycleStatus: lifecycle,
        lifecycleLabel: PROGRAM_STATUS_LABELS[lifecycle],
        courses: firstRelation(
          row.courses as { title: string } | { title: string }[] | null,
        ),
      }
    })
  }

  const appOrFilter =
    applicationIds.length > 1
      ? `application_id.in.(${applicationIds.join(',')})`
      : `application_id.eq.${student.application_id}`

  const [
    { data: documents },
    { data: invoices },
    { data: certificates },
    { data: notifications },
    { data: commLogs },
  ] = await Promise.all([
    supabase
      .from('documents')
      .select('id, document_type, file_name, r2_key')
      .or(`student_id.eq.${studentId},${appOrFilter}`)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('id, type, status, total_ghs, amount_ghs')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false }),
    supabase
      .from('certificates')
      .select('id, enrollment_id, r2_key, file_name, uploaded_at')
      .eq('student_id', studentId),
    supabase
      .from('notifications_log')
      .select('id, channel, event_type, status, recipient, provider_response, sent_at')
      .or(`student_id.eq.${studentId},${appOrFilter}`)
      .order('sent_at', { ascending: false })
      .limit(100),
    supabase
      .from('communication_logs')
      .select(
        'id, channel, status, recipient, error_message, sent_at, communication_campaigns(subject, message, channel)',
      )
      .eq('student_id', studentId)
      .order('sent_at', { ascending: false })
      .limit(100),
  ])

  const detail: AdminStudentDetail = {
    id: student.id,
    student_id: student.student_id,
    full_name: student.full_name,
    real_email: student.real_email,
    phone: student.phone,
    country: student.country,
    created_at: student.created_at,
    profile_photo_r2_key: student.profile_photo_r2_key,
    application_id: student.application_id,
    enrollments: (student.enrollments as AdminStudentDetail['enrollments']) ?? [],
    certificates: (certificates ?? []) as AdminStudentDetail['certificates'],
    invoices: (invoices ?? []) as AdminStudentDetail['invoices'],
    documents: (documents ?? []) as AdminStudentDetail['documents'],
    applications: firstRelation(
      student.applications as AdminStudentDetail['applications'] | AdminStudentDetail['applications'][],
    ),
    allApplications: applicationRows,
    notifications: (notifications ?? []) as AdminStudentDetail['notifications'],
    communicationLogs: (commLogs ?? []).map((row) => ({
      id: row.id,
      channel: row.channel,
      status: row.status,
      recipient: row.recipient,
      error_message: row.error_message,
      sent_at: row.sent_at,
      communication_campaigns: firstRelation(
        row.communication_campaigns as unknown as AdminStudentDetail['communicationLogs'][0]['communication_campaigns'],
      ),
    })),
  }

  return { detail }
}
