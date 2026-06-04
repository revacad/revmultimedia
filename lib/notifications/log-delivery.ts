import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessage } from '@/lib/notifications/sms'
import { sendApplicationReceived, sendWaitlistConfirmation } from '@/lib/notifications/email'

export type NotificationLogStatus = 'sent' | 'failed' | 'skipped'

export type LogNotificationInput = {
  applicationId?: string | null
  studentId?: string | null
  channel: 'email' | 'sms' | 'whatsapp'
  eventType: string
  recipient: string
  status: NotificationLogStatus
  providerResponse?: Record<string, unknown> | null
}

export async function logNotification(
  supabase: SupabaseClient,
  input: LogNotificationInput,
): Promise<void> {
  const { error } = await supabase.from('notifications_log').insert({
    application_id: input.applicationId ?? null,
    student_id: input.studentId ?? null,
    channel: input.channel,
    event_type: input.eventType,
    recipient: input.recipient,
    status: input.status,
    provider_response: input.providerResponse ?? null,
  })

  if (error) {
    console.error('[notifications:log]', input.eventType, error.message)
  }
}

function resultToStatus(result: {
  sent?: boolean
  skipped?: boolean
  error?: string
}): NotificationLogStatus {
  if (result.sent) return 'sent'
  if (result.skipped) return 'skipped'
  return 'failed'
}

function resultToPayload(result: {
  sent?: boolean
  skipped?: boolean
  error?: string
  providerMessageId?: string
  note?: string
}): Record<string, unknown> | null {
  if (result.providerMessageId) {
    return { providerMessageId: result.providerMessageId }
  }
  if (result.note) return { note: result.note }
  if (result.error) return { error: result.error }
  if (result.skipped) {
    return { message: 'Provider not configured or message skipped' }
  }
  return null
}

/** WhatsApp first, then SMS. Each attempt is logged. */
export async function deliverWhatsAppThenSms(params: {
  phone: string
  message: string
  applicationId?: string | null
  studentId?: string | null
  eventType: string
  supabase?: SupabaseClient
}): Promise<{ delivered: boolean; finalChannel: 'whatsapp' | 'sms' | null }> {
  const supabase = params.supabase ?? createAdminClient()

  const wa = await sendMessage(params.phone, params.message, 'whatsapp')
  await logNotification(supabase, {
    applicationId: params.applicationId,
    studentId: params.studentId,
    channel: 'whatsapp',
    eventType: params.eventType,
    recipient: params.phone,
    status: resultToStatus(wa),
    providerResponse: resultToPayload(wa),
  })

  if (wa.sent) {
    return { delivered: true, finalChannel: 'whatsapp' }
  }

  const sms = await sendMessage(params.phone, params.message, 'sms')
  await logNotification(supabase, {
    applicationId: params.applicationId,
    studentId: params.studentId,
    channel: 'sms',
    eventType: params.eventType,
    recipient: params.phone,
    status: resultToStatus(sms),
    providerResponse: resultToPayload({
      ...sms,
      note: wa.skipped
        ? 'SMS after WhatsApp was skipped (not configured)'
        : wa.error
          ? 'SMS after WhatsApp failed'
          : undefined,
    }),
  })

  if (sms.sent) {
    return { delivered: true, finalChannel: 'sms' }
  }

  return { delivered: false, finalChannel: null }
}

export async function deliverApplicationReceivedEmail(params: {
  email: string
  name: string
  reference: string
  courseName: string
  intakeName?: string
  applicationFeeGhs: number
  applicationId: string
  supabase?: SupabaseClient
}): Promise<void> {
  const supabase = params.supabase ?? createAdminClient()

  try {
    await sendApplicationReceived(params.email, {
      name: params.name,
      reference: params.reference,
      courseName: params.courseName,
      intakeName: params.intakeName,
      applicationFeeGhs: params.applicationFeeGhs,
    })
    await logNotification(supabase, {
      applicationId: params.applicationId,
      channel: 'email',
      eventType: 'application_received',
      recipient: params.email,
      status: 'sent',
    })
  } catch (err) {
    await logNotification(supabase, {
      applicationId: params.applicationId,
      channel: 'email',
      eventType: 'application_received',
      recipient: params.email,
      status: 'failed',
      providerResponse: {
        error: err instanceof Error ? err.message : 'Email send failed',
      },
    })
  }
}

export async function deliverWaitlistConfirmationEmail(params: {
  email: string
  name: string
  reference: string
  courseName: string
  intakeName: string
  waitlistPosition: number
  applicationId: string
  supabase?: SupabaseClient
}): Promise<void> {
  const supabase = params.supabase ?? createAdminClient()

  try {
    await sendWaitlistConfirmation(params.email, {
      name: params.name,
      reference: params.reference,
      courseName: params.courseName,
      intakeName: params.intakeName,
      waitlistPosition: params.waitlistPosition,
    })
    await logNotification(supabase, {
      applicationId: params.applicationId,
      channel: 'email',
      eventType: 'waitlist_confirmation',
      recipient: params.email,
      status: 'sent',
    })
  } catch (err) {
    await logNotification(supabase, {
      applicationId: params.applicationId,
      channel: 'email',
      eventType: 'waitlist_confirmation',
      recipient: params.email,
      status: 'failed',
      providerResponse: {
        error: err instanceof Error ? err.message : 'Email send failed',
      },
    })
  }
}
