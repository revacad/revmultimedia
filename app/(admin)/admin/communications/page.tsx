import CommunicationsPageClient, {
  type CampaignListRow,
} from '@/components/admin/communications/CommunicationsPageClient'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Communications — Admin',
}

export const dynamic = 'force-dynamic'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function AdminCommunicationsPage() {
  const supabase = createAdminClient()

  const [{ data: campaigns, error }, { data: courses }, { data: intakes }] =
    await Promise.all([
      supabase
        .from('communication_campaigns')
        .select('*, admins(full_name)')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase.from('courses').select('id, title').order('title'),
      supabase.from('intakes').select('id, name, course_id').order('start_date', { ascending: false }),
    ])

  if (error) {
    console.error('[admin/communications] fetch failed', error)
  }

  const rows: CampaignListRow[] = (campaigns ?? []).map((row) => ({
    id: row.id,
    channel: row.channel,
    subject: row.subject,
    message: row.message,
    recipient_count: row.recipient_count,
    sent_count: row.sent_count,
    failed_count: row.failed_count,
    status: row.status,
    created_at: row.created_at,
    admins: firstRelation(row.admins as CampaignListRow['admins'] | CampaignListRow['admins'][] | null),
  }))

  return (
    <CommunicationsPageClient
      campaigns={rows}
      courses={courses ?? []}
      intakes={intakes ?? []}
    />
  )
}
