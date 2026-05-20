import { getSystemSettings } from '@/lib/settings/cache'
import { withRetry } from '@/lib/retry'

type SmsChannel = 'sms' | 'whatsapp'

export async function sendMessage(
  phone: string,
  message: string,
  channel: SmsChannel,
): Promise<{ skipped?: boolean; sent?: boolean; error?: string }> {
  if (channel === 'whatsapp') {
    return sendViaSentDm(phone, message, channel)
  }

  const settings = await getSystemSettings()
  const smsProvider =
    settings.sms_provider || process.env.SMS_PROVIDER || 'sentdm'

  if (smsProvider === 'fishafrica') {
    return sendViaFishAfrica(phone, message, settings)
  }

  return sendViaSentDm(phone, message, channel, settings)
}

async function sendViaSentDm(
  phone: string,
  message: string,
  channel: SmsChannel,
  settings?: Record<string, string>,
): Promise<{ skipped?: boolean; sent?: boolean; error?: string }> {
  const apiKey =
    settings?.sentdm_api_key?.trim() || process.env.SENTDM_API_KEY

  if (!apiKey) {
    return { skipped: true }
  }

  const senderId =
    settings?.sentdm_sender_id?.trim() ||
    process.env.SENTDM_SENDER_ID ||
    'RevAcademy'

  try {
    const response = await withRetry(
      () =>
        fetch('https://api.sent.dm/v1/messages', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone,
            message,
            channel,
            sender_id: senderId,
          }),
        }),
      { maxRetries: 3, baseDelayMs: 1000 },
    )

    if (!response.ok) {
      const body = await response.text()
      return { error: body || `Sent.dm request failed (${response.status})` }
    }

    return { sent: true }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown Sent.dm error'
    return { error: errorMessage }
  }
}

async function sendViaFishAfrica(
  phone: string,
  message: string,
  settings: Record<string, string>,
): Promise<{ skipped?: boolean; sent?: boolean; error?: string }> {
  const apiKey =
    settings.fishafrica_api_key?.trim() || process.env.FISHAFRICA_API_KEY

  if (!apiKey) {
    return { skipped: true }
  }

  const senderId =
    settings.fishafrica_sender_id?.trim() ||
    process.env.FISHAFRICA_SENDER_ID ||
    'RevAcademy'

  const apiUrl =
    process.env.FISHAFRICA_API_URL ||
    'https://api.letsfish.africa/v1/sms/send'

  try {
    const response = await withRetry(
      () =>
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: phone,
            message,
            sender_id: senderId,
          }),
        }),
      { maxRetries: 3, baseDelayMs: 1000 },
    )

    if (!response.ok) {
      const body = await response.text()
      return { error: body || `Fish Africa request failed (${response.status})` }
    }

    return { sent: true }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown Fish Africa error'
    return { error: errorMessage }
  }
}
