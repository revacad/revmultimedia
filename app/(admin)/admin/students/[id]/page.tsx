import StudentDetailView, {
  type AdminStudentDetail,
} from '@/components/admin/students/StudentDetailView'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  const { data: notifications } = await supabase
    .from('notifications_log')
    .select('id, channel, event_type, status, sent_at')
    .eq('student_id', id)
    .order('sent_at', { ascending: false })
    .limit(10)

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
    notifications: (notifications ?? []) as AdminStudentDetail['notifications'],
  }

  return <StudentDetailView student={detail} />
}
