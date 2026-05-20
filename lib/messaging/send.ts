import { Resend } from 'resend'
import { sendMessage } from '@/lib/notifications/sms'
import { withRetry } from '@/lib/retry'
import type { CommunicationChannel } from '@/lib/messaging/types'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendCampaignMessage(params: {
  channel: CommunicationChannel
  subject?: string | null
  message: string
  recipientName: string
  recipientAddress: string
}): Promise<{
  sent: boolean
  skipped?: boolean
  error?: string
  providerMessageId?: string
}> {
  const { channel, subject, message, recipientName, recipientAddress } = params

  if (channel === 'email') {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return { sent: false, skipped: true, error: 'RESEND_API_KEY not configured' }
    }

    try {
      const resend = new Resend(apiKey)
      const { error } = await withRetry(
        () =>
          resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: recipientAddress,
            subject: subject || 'Message from Rev Multimedia',
            html: `<p>Dear ${escapeHtml(recipientName)},</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
          }),
        { maxRetries: 3, baseDelayMs: 1000 },
      )
      if (error) {
        return { sent: false, error: error.message }
      }
      return { sent: true }
    } catch (e) {
      return {
        sent: false,
        error: e instanceof Error ? e.message : 'Email send failed',
      }
    }
  }

  const result = await sendMessage(
    recipientAddress,
    message,
    channel as 'sms' | 'whatsapp',
  )

  if (result.skipped) {
    return { sent: false, skipped: true, error: 'SMS provider not configured' }
  }
  if (result.error) {
    return { sent: false, error: result.error }
  }
  return {
    sent: true,
    providerMessageId: result.providerMessageId,
  }
}
