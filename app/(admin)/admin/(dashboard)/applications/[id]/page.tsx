import { notFound } from 'next/navigation'
import ApplicationDetailView from '@/components/admin/applications/ApplicationDetailView'
import { requireStaffAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapApplicationDetail } from '@/lib/applications/map'
import { getPrivateR2PresignedUrl } from '@/lib/r2/private-object-url'

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

  const returningStudentId = (application as { returning_student_id?: string | null })
    .returning_student_id

  let profilePhotoR2Key: string | null = null

  const { data: studentByApplication } = await supabase
    .from('students')
    .select('profile_photo_r2_key')
    .eq('application_id', id)
    .maybeSingle()

  profilePhotoR2Key = studentByApplication?.profile_photo_r2_key ?? null

  if (!profilePhotoR2Key && returningStudentId) {
    const { data: returningStudent } = await supabase
      .from('students')
      .select('profile_photo_r2_key')
      .eq('id', returningStudentId)
      .maybeSingle()
    profilePhotoR2Key = returningStudent?.profile_photo_r2_key ?? null
  }

  const profilePhotoUrl = await getPrivateR2PresignedUrl(profilePhotoR2Key)

  const { data: studentForApplication } = await supabase
    .from('students')
    .select('id')
    .eq('application_id', id)
    .maybeSingle()

  return (
    <ApplicationDetailView
      application={mapped}
      hasStudentRecord={Boolean(studentForApplication ?? returningStudentId)}
      profilePhotoUrl={profilePhotoUrl}
    />
  )
}
