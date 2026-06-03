import StudentDetailView from '@/components/admin/students/StudentDetailView'
import { fetchAdminStudentDetail } from '@/lib/admin/fetch-student-detail'
import { getPrivateR2PresignedUrl } from '@/lib/r2/private-object-url'
import { requireStaffAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireStaffAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const result = await fetchAdminStudentDetail(supabase, id)

  if ('error' in result) {
    if (result.error === 'Student not found') {
      notFound()
    }
    console.error('[admin/students/detail]', result.error)
    notFound()
  }

  const profilePhotoUrl = await getPrivateR2PresignedUrl(result.detail.profile_photo_r2_key)

  return <StudentDetailView student={result.detail} profilePhotoUrl={profilePhotoUrl} />
}
