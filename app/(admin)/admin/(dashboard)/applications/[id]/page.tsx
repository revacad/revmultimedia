import { notFound } from 'next/navigation'
import ApplicationDetailView from '@/components/admin/applications/ApplicationDetailView'
import { requireStaffAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapApplicationDetail } from '@/lib/applications/map'
import { findSameIntakeActiveEnrollment } from '@/lib/portal/same-intake-active-enrollment'
import { getPrivateR2PresignedUrl } from '@/lib/r2/private-object-url'
import type { AdminReviewBanner } from '@/components/admin/applications/ApplicationDetailView'

export const dynamic = 'force-dynamic'

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ApplicationDetailPageProps) {
  const { id } = await params
  return {
    title: `Application ${id.slice(0, 8)}… — Admin`,
  }
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  await requireStaffAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const { data: application, error } = await supabase
    .from('applications')
    .select(
      `
      *,
      senior_high_schools(name, region),
      courses(id, title, category, mode, tuition_fee_ghs),
      intakes(id, name, start_date, end_date, max_slots, enrolled_count),
      documents(*),
      invoices(*, payment_types(label), installments(amount_ghs)),
      admin_notes(*, admins(full_name))
    `,
    )
    .eq('id', id)
    .single()

  if (error || !application) {
    notFound()
  }

  const mapped = mapApplicationDetail(application as Record<string, unknown>)

  const { data: studentByApplication } = await supabase
    .from('students')
    .select('id, student_id, profile_photo_r2_key')
    .eq('application_id', id)
    .maybeSingle()

  let returningStudent: { id: string; student_id: string } | null = null
  const returningStudentId = (application as { returning_student_id?: string | null })
    .returning_student_id
  if (returningStudentId) {
    const { data } = await supabase
      .from('students')
      .select('id, student_id')
      .eq('id', returningStudentId)
      .maybeSingle()
    returningStudent = data
  }

  const profilePhotoUrl = await getPrivateR2PresignedUrl(
    studentByApplication?.profile_photo_r2_key as string | null,
  )

  let adminReviewBanner: AdminReviewBanner | null = null
  if (mapped.requires_admin_review && mapped.intakes?.id) {
    const studentDbId = returningStudent?.id ?? studentByApplication?.id
    const studentId =
      returningStudent?.student_id ?? studentByApplication?.student_id ?? null

    if (studentDbId) {
      const conflict = await findSameIntakeActiveEnrollment(
        supabase,
        studentDbId,
        mapped.intakes.id,
      )
      if (conflict && studentId) {
        adminReviewBanner = {
          studentId,
          existingCourseTitle: conflict.existingCourseTitle,
          intakeName: conflict.intakeName,
        }
      }
    }
  }

  return (
    <ApplicationDetailView
      application={mapped}
      hasStudentRecord={Boolean(studentByApplication)}
      profilePhotoUrl={profilePhotoUrl}
      adminReviewBanner={adminReviewBanner}
    />
  )
}
