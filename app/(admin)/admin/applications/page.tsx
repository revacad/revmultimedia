import ApplicationsPageClient from '@/components/admin/applications/ApplicationsPageClient'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapApplicationListRow } from '@/lib/applications/map'

export const metadata = {
  title: 'Applications — Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id, reference, full_name, real_email, phone,
      country, status, app_fee_paid, created_at,
      courses(title, category),
      intakes(name, start_date)
    `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/applications] fetch failed', error)
  }

  const applications = (data ?? []).map((row) =>
    mapApplicationListRow(row as Record<string, unknown>),
  )

  return <ApplicationsPageClient applications={applications} />
}
