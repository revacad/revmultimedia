import StudentDetailView, {
  type AdminStudentDetail,
} from '@/components/admin/students/StudentDetailView'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const { data: student, error } = await supabase
    .from('students')
    .select(
      `
      *,
      applications(reference),
      enrollments(
        *,
        courses(id, title, slug, category),
        intakes(name, start_date, end_date)
      ),
      certificates(*),
      invoices(*),
      documents(*)
    `,
    )
    .eq('id', id)
    .single()

  if (error || !student) {
    notFound()
  }

  const [{ data: allApplications }, { data: notifications }, { data: commLogs }] =
    await Promise.all([
    student.auth_user_id
      ? supabase
          .from('applications')
          .select('id, reference, status, created_at, courses(title)')
          .eq('auth_user_id', student.auth_user_id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from('notifications_log')
      .select('id, channel, event_type, status, sent_at')
      .eq('student_id', id)
      .order('sent_at', { ascending: false })
      .limit(10),
    supabase
      .from('communication_logs')
      .select('*, communication_campaigns(subject, message, channel)')
      .eq('student_id', id)
      .order('sent_at', { ascending: false })
      .limit(20),
  ])

  const applicationRows = (allApplications ?? []).map((row) => ({
    id: row.id,
    reference: row.reference,
    status: row.status as AdminStudentDetail['allApplications'][0]['status'],
    created_at: row.created_at,
    courses: firstRelation(
      row.courses as { title: string } | { title: string }[] | null,
    ),
  }))

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
    certificates: (student.certificates as AdminStudentDetail['certificates']) ?? [],
    invoices: (student.invoices as AdminStudentDetail['invoices']) ?? [],
    documents: (student.documents as AdminStudentDetail['documents']) ?? [],
    applications: student.applications as AdminStudentDetail['applications'],
    allApplications: applicationRows,
    notifications: (notifications ?? []) as AdminStudentDetail['notifications'],
    communicationLogs: (commLogs ?? []).map((row) => ({
      id: row.id,
      channel: row.channel,
      status: row.status,
      sent_at: row.sent_at,
      communication_campaigns: firstRelation(
        row.communication_campaigns as AdminStudentDetail['communicationLogs'][0]['communication_campaigns'],
      ),
    })),
  }

  return <StudentDetailView student={detail} />
}
