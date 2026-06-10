import StudentsPageClient, {
  type StudentListRow,
} from '@/components/admin/students/StudentsPageClient'
import { fetchEnrolledStudentsGrouped } from '@/lib/admin/fetch-enrolled-students-list'
import { ADMIN_PAGE_SIZE, adminListRange, parseAdminPage } from '@/lib/admin/pagination'
import { requireStaffAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Students - Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await requireStaffAdmin()
  const { page: pageParam } = await searchParams
  const page = parseAdminPage(pageParam)
  const { from, to } = adminListRange(page)

  const supabase = createAdminClient()
  const { students: grouped, totalCount, channelCounts } =
    await fetchEnrolledStudentsGrouped(supabase, {
    from,
    to,
  })

  const students: StudentListRow[] = grouped.map((row) => ({
    id: row.authUserId,
    studentDbId: row.studentDbId,
    student_id: row.student_id,
    full_name: row.full_name,
    real_email: row.real_email,
    phone: row.phone,
    country: row.country,
    latestEnrolledAt: row.latestEnrolledAt,
    isLevelUp: row.isLevelUp,
    enrollments: row.enrollments,
    profilePhotoUrl: row.profilePhotoUrl,
  }))

  return (
    <StudentsPageClient
      students={students}
      fetchError={null}
      currentPage={page}
      totalCount={totalCount}
      pageSize={ADMIN_PAGE_SIZE}
      channelCounts={channelCounts}
    />
  )
}
