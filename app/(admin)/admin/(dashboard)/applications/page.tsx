import ApplicationsPageClient from '@/components/admin/applications/ApplicationsPageClient'
import { mapApplicationListRow } from '@/lib/applications/map'
import { ADMIN_PAGE_SIZE, adminListRange, parseAdminPage } from '@/lib/admin/pagination'
import { requireStaffAdmin } from '@/lib/auth/requireAdmin'
import { supabaseErrorMessage } from '@/lib/errors/query'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Applications - Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await requireStaffAdmin()
  const { page: pageParam } = await searchParams
  const page = parseAdminPage(pageParam)
  const { from, to } = adminListRange(page)

  const supabase = createAdminClient()

  const [
    { data, error, count },
    { count: pendingReviewCount },
    { count: acceptedCount },
    { count: rejectedCount },
    { count: standardCount },
    { count: levelUpCount },
  ] = await Promise.all([
    supabase
      .from('applications')
      .select(
        `
      id, reference, full_name, real_email, phone,
      country, status, application_channel, app_fee_paid, requires_admin_review, created_at,
      students:students!students_application_id_fkey(student_id),
      returning_student:students!applications_returning_student_id_fkey(student_id),
      courses(title, category),
      intakes(name, start_date)
    `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'under_review']),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted'),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected'),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('application_channel', 'standard'),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('application_channel', 'level_up'),
  ])

  if (error) {
    console.error('[admin/applications] fetch failed', {
      message: error.message,
      code: error.code,
    })
  }

  const fetchError = error ? supabaseErrorMessage(error, 'admin/applications') : null

  const applications = (data ?? []).map((row) =>
    mapApplicationListRow(row as Record<string, unknown>),
  )

  return (
    <ApplicationsPageClient
      applications={applications}
      fetchError={fetchError}
      currentPage={page}
      totalCount={count ?? 0}
      pageSize={ADMIN_PAGE_SIZE}
      stats={{
        total: count ?? 0,
        pendingReview: pendingReviewCount ?? 0,
        accepted: acceptedCount ?? 0,
        rejected: rejectedCount ?? 0,
      }}
      channelCounts={{
        all: count ?? 0,
        standard: standardCount ?? 0,
        level_up: levelUpCount ?? 0,
      }}
    />
  )
}
