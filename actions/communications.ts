'use server'

import { revalidatePath } from 'next/cache'
import { getQStashClient, publishJSONWithRetry } from '@/lib/qstash/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { sendMessage } from '@/lib/notifications/sms'
import { sendCampaignMessage } from '@/lib/messaging/send'
import { resolveCampaignRecipients } from '@/lib/messaging/recipients'
import { z } from 'zod'
import type {
  CampaignFilters,
  CampaignRecipient,
  CommunicationChannel,
} from '@/lib/messaging/types'
import {
  createCampaignInputSchema,
  sendDirectMessageInputSchema,
} from '@/lib/validations/communications'

async function getAdminRecord() {
  const session = await requireAdmin()
  const supabase = createAdminClient()
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('auth_user_id', session.userId)
    .single()

  if (!admin) {
    throw new Error('Not an admin')
  }

  return { admin, supabase }
}

export async function sendDirectMessage(data: {
  studentId: string
  channel: CommunicationChannel
  subject?: string
  message: string
}): Promise<{ success: true } | { error: string }> {
  try {
    const parsed = sendDirectMessageInputSchema.safeParse(data)
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid message',
      }
    }

    const { admin, supabase } = await getAdminRecord()
    const payload = parsed.data

    const { data: student } = await supabase
      .from('students')
      .select('real_email, phone, full_name')
      .eq('id', payload.studentId)
      .single()

    if (!student) return { error: 'Student not found' }

    const filters: CampaignFilters = {
      audience: 'direct',
      studentId: payload.studentId,
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('communication_campaigns')
      .insert({
        channel: payload.channel,
        subject: payload.subject || null,
        message: payload.message,
        filters,
        recipient_count: 1,
        status: 'queued',
        created_by: admin.id,
        queued_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (campaignError || !campaign) {
      return { error: 'Failed to create campaign' }
    }

    const recipient =
      payload.channel === 'email' ? student.real_email : student.phone

    const sendResult = await sendCampaignMessage({
      channel: payload.channel,
      subject: payload.subject,
      message: payload.message,
      recipientName: student.full_name,
      recipientAddress: recipient,
    })

    const logStatus = sendResult.sent
      ? 'sent'
      : sendResult.skipped
        ? 'skipped'
        : 'failed'

    await supabase.from('communication_logs').insert({
      campaign_id: campaign.id,
      student_id: payload.studentId,
      recipient,
      channel: payload.channel,
      status: logStatus,
      error_message: sendResult.error ?? null,
    })

    await supabase
      .from('communication_campaigns')
      .update({
        status: sendResult.sent ? 'completed' : 'failed',
        sent_count: sendResult.sent ? 1 : 0,
        failed_count: sendResult.sent ? 0 : 1,
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaign.id)

    if (!sendResult.sent) {
      return { error: sendResult.error ?? 'Failed to send message' }
    }

    revalidatePath(`/admin/students/${payload.studentId}`)
    revalidatePath('/admin/communications')
    revalidatePath(`/admin/communications/${campaign.id}`)
    return { success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to send message',
    }
  }
}

export async function createCampaign(data: {
  channel: CommunicationChannel
  subject?: string
  message: string
  filters: CampaignFilters
}): Promise<{ success: true; campaignId: string } | { error: string }> {
  try {
    const parsed = createCampaignInputSchema.safeParse(data)
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid campaign',
      }
    }

    const { admin, supabase } = await getAdminRecord()
    const payload = parsed.data

    const recipients = await resolveCampaignRecipients(supabase, payload.filters)
    if (recipients.length === 0) {
      return { error: 'No recipients match the selected audience' }
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('communication_campaigns')
      .insert({
        channel: payload.channel,
        subject: payload.subject || null,
        message: payload.message,
        filters: payload.filters,
        recipient_count: recipients.length,
        status: 'queued',
        created_by: admin.id,
        queued_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (campaignError || !campaign) {
      return { error: 'Failed to create campaign' }
    }

    const logs = recipients.map((recipient) => ({
      campaign_id: campaign.id,
      student_id: recipient.studentId,
      recipient:
        payload.channel === 'email' ? recipient.email : recipient.phone,
      channel: payload.channel,
      status: 'pending' as const,
    }))

    const { error: logsError } = await supabase
      .from('communication_logs')
      .insert(logs)

    if (logsError) {
      return { error: logsError.message }
    }

    if (recipients.length === 1) {
      await processSingleRecipientCampaign(
        supabase,
        campaign.id,
        payload.channel,
        payload.subject,
        payload.message,
        recipients[0],
      )
    } else {
      await queueCampaignProcessing(campaign.id)
    }

    revalidatePath('/admin/communications')
    revalidatePath(`/admin/communications/${campaign.id}`)
    return { success: true, campaignId: campaign.id }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to create campaign',
    }
  }
}

async function processSingleRecipientCampaign(
  supabase: ReturnType<typeof createAdminClient>,
  campaignId: string,
  channel: CommunicationChannel,
  subject: string | undefined,
  message: string,
  recipient: CampaignRecipient,
) {
  const address = channel === 'email' ? recipient.email : recipient.phone
  const result = await sendCampaignMessage({
    channel,
    subject,
    message,
    recipientName: recipient.fullName,
    recipientAddress: address,
  })

  const logStatus = result.sent ? 'sent' : result.skipped ? 'skipped' : 'failed'

  await supabase
    .from('communication_logs')
    .update({
      status: logStatus,
      error_message: result.error ?? null,
    })
    .eq('campaign_id', campaignId)

  await supabase
    .from('communication_campaigns')
    .update({
      status: result.sent ? 'completed' : 'failed',
      sent_count: result.sent ? 1 : 0,
      failed_count: result.sent ? 0 : 1,
      completed_at: new Date().toISOString(),
    })
    .eq('id', campaignId)
}

async function queueCampaignProcessing(campaignId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  const token = process.env.QSTASH_TOKEN

  if (!baseUrl || !token) {
    const { processCampaignBatch } = await import('@/lib/messaging/process-batch')
    let done = false
    while (!done) {
      const result = await processCampaignBatch(campaignId)
      done = result.done
    }
    return
  }

  const client = getQStashClient()
  if (!client) return

  await publishJSONWithRetry(client, {
    url: `${baseUrl.replace(/\/$/, '')}/api/messaging/process`,
    body: { campaignId },
  })
}

export async function sendTestSms(
  phone: string,
): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()
    const parsed = z
      .string()
      .trim()
      .min(5, 'Enter a valid phone number for the test SMS')
      .max(32, 'Phone number is too long')
      .safeParse(phone)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid phone number' }
    }
    const normalized = parsed.data

    const result = await sendMessage(
      normalized,
      'Test message from Rev Multimedia. Your SMS provider is configured correctly.',
      'sms',
    )

    if (result.skipped) {
      return { error: 'SMS provider is not configured' }
    }
    if (result.error) {
      return { error: result.error }
    }
    return { success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to send test SMS',
    }
  }
}
