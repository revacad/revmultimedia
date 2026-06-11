import { Resend } from 'resend'
import { sendMessage } from '@/lib/notifications/sms'
import { withRetry } from '@/lib/retry'
import type { CommunicationChannel } from '@/lib/messaging/types'

import { resolveResendFrom } from '@/lib/notifications/resend-from'
import { escapeHtml } from '@/lib/security/escape-html'
import { logServerError } from '@/lib/errors/log'

const SEND_ERROR = 'Message could not be sent. Please try again.'

export async function sendCampaignMessage(params: {
  channel: CommunicationChannel
  subject?: string | null
  message: string
  recipientName: string
  recipientAddress: string
  /** Overrides RESEND_FROM_EMAIL for this send only (email channel). */
  fromOverride?: string
}): Promise<{
  sent: boolean
  skipped?: boolean
  error?: string
  providerMessageId?: string
}> {
  const { channel, subject, message, recipientName, recipientAddress, fromOverride } = params

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
            from: resolveResendFrom(fromOverride),
            to: recipientAddress,
            subject: subject || 'Message from Rev Multimedia',
            html: `<p>Dear ${escapeHtml(recipientName)},</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
          }),
        { maxRetries: 3, baseDelayMs: 1000 },
      )
      if (error) {
        logServerError('messaging/send:email', error)
        return { sent: false, error: SEND_ERROR }
      }
      return { sent: true }
    } catch (e) {
      logServerError('messaging/send:email', e)
      return {
        sent: false,
        error: SEND_ERROR,
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
    logServerError('messaging/send:sms', new Error(result.error))
    return { sent: false, error: SEND_ERROR }
  }
  return {
    sent: true,
    providerMessageId: result.providerMessageId,
  }
}
