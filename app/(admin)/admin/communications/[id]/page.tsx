import CampaignDetailClient, {
  type CampaignDetail,
  type CommunicationLogRow,
} from '@/components/admin/communications/CampaignDetailClient'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function AdminCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const { data: campaign, error } = await supabase
    .from('communication_campaigns')
    .select('*, admins(full_name)')
    .eq('id', id)
    .single()

  if (error || !campaign) {
    notFound()
  }

  const { data: logs } = await supabase
    .from('communication_logs')
    .select('*, students(full_name, student_id)')
    .eq('campaign_id', id)
    .order('sent_at', { ascending: false })

  const detail: CampaignDetail = {
    id: campaign.id,
    channel: campaign.channel,
    subject: campaign.subject,
    message: campaign.message,
    recipient_count: campaign.recipient_count,
    sent_count: campaign.sent_count,
    failed_count: campaign.failed_count,
    status: campaign.status,
    created_at: campaign.created_at,
    completed_at: campaign.completed_at,
    admins: firstRelation(campaign.admins as CampaignDetail['admins'] | CampaignDetail['admins'][] | null),
  }

  const logRows: CommunicationLogRow[] = (logs ?? []).map((row) => ({
    id: row.id,
    recipient: row.recipient,
    channel: row.channel,
    status: row.status,
    error_message: row.error_message,
    sent_at: row.sent_at,
    students: firstRelation(
      row.students as CommunicationLogRow['students'] | CommunicationLogRow['students'][] | null,
    ),
  }))

  return <CampaignDetailClient campaign={detail} logs={logRows} />
}
