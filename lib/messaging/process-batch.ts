import { createAdminClient } from '@/lib/supabase/admin'
import { sendCampaignMessage } from '@/lib/messaging/send'
import type { CommunicationChannel } from '@/lib/messaging/types'

const BATCH_SIZE = 50

export async function processCampaignBatch(campaignId: string): Promise<{
  done: boolean
  processed: number
}> {
  const supabase = createAdminClient()

  const { data: campaign } = await supabase
    .from('communication_campaigns')
    .select('id, channel, subject, message, status, sent_count, failed_count')
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    return { done: true, processed: 0 }
  }

  if (campaign.status === 'queued') {
    await supabase
      .from('communication_campaigns')
      .update({ status: 'processing' })
      .eq('id', campaignId)
  }

  const { data: pendingLogs } = await supabase
    .from('communication_logs')
    .select('id, student_id, recipient, channel')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .order('sent_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (!pendingLogs?.length) {
    await finalizeCampaign(campaignId)
    return { done: true, processed: 0 }
  }

  const studentIds = pendingLogs
    .map((log) => log.student_id)
    .filter((id): id is string => Boolean(id))

  const { data: students } = studentIds.length
    ? await supabase
        .from('students')
        .select('id, full_name')
        .in('id', studentIds)
    : { data: [] }

  const nameById = new Map(
    (students ?? []).map((s) => [s.id, s.full_name] as const),
  )

  let sentDelta = 0
  let failedDelta = 0

  for (const log of pendingLogs) {
    const channel = log.channel as CommunicationChannel
    const recipientName =
      (log.student_id && nameById.get(log.student_id)) || 'Student'

    const result = await sendCampaignMessage({
      channel,
      subject: campaign.subject,
      message: campaign.message,
      recipientName,
      recipientAddress: log.recipient,
    })

    if (result.sent) {
      sentDelta += 1
      await supabase
        .from('communication_logs')
        .update({ status: 'sent', error_message: null })
        .eq('id', log.id)
    } else if (result.skipped) {
      failedDelta += 1
      await supabase
        .from('communication_logs')
        .update({
          status: 'skipped',
          error_message: result.error ?? 'Provider not configured',
        })
        .eq('id', log.id)
    } else {
      failedDelta += 1
      await supabase
        .from('communication_logs')
        .update({
          status: 'failed',
          error_message: result.error ?? 'Send failed',
        })
        .eq('id', log.id)
    }
  }

  await supabase
    .from('communication_campaigns')
    .update({
      sent_count: (campaign.sent_count ?? 0) + sentDelta,
      failed_count: (campaign.failed_count ?? 0) + failedDelta,
    })
    .eq('id', campaignId)

  const { count } = await supabase
    .from('communication_logs')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')

  const remaining = count ?? 0
  if (remaining === 0) {
    await finalizeCampaign(campaignId)
    return { done: true, processed: pendingLogs.length }
  }

  return { done: false, processed: pendingLogs.length }
}

async function finalizeCampaign(campaignId: string) {
  const supabase = createAdminClient()
  await supabase
    .from('communication_campaigns')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', campaignId)
}

export { BATCH_SIZE }
