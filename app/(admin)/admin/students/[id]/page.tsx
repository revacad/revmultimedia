import StudentDetailView from '@/components/admin/students/StudentDetailView'
import { fetchAdminStudentDetail } from '@/lib/admin/fetch-student-detail'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
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

  return <StudentDetailView student={result.detail} />
}
