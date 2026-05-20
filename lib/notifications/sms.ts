import { getSystemSettings } from '@/lib/settings/cache'
import { sendFishAfricaSMS } from '@/lib/notifications/providers/fishafrica'
import { sendSentDmMessage } from '@/lib/notifications/providers/sentdm'

export async function sendMessage(
  phone: string,
  message: string,
  channel: 'sms' | 'whatsapp',
): Promise<{ skipped?: boolean; sent?: boolean; error?: string }> {
  const settings = await getSystemSettings()

  if (channel === 'whatsapp') {
    const apiKey = process.env.SENTDM_API_KEY || settings.sentdm_api_key
    const templateId =
      process.env.SENTDM_WHATSAPP_TEMPLATE_ID ||
      settings.sentdm_whatsapp_template_id

    if (!apiKey || !templateId) {
      console.warn(
        'WhatsApp skipped: SENTDM_API_KEY or SENTDM_WHATSAPP_TEMPLATE_ID not set',
      )
      return { skipped: true }
    }

    const result = await sendSentDmMessage(
      phone,
      { id: templateId, parameters: { message } },
      'whatsapp',
      apiKey,
    )
    return result.success ? { sent: true } : { error: result.error }
  }

  const fishAfricaKey =
    process.env.FISHAFRICA_API_KEY || settings.fishafrica_api_key
  const fishAfricaSenderId =
    process.env.FISHAFRICA_SENDER_ID ||
    settings.fishafrica_sender_id ||
    'RevMultimedia'

  if (fishAfricaKey) {
    const result = await sendFishAfricaSMS(
      [phone],
      message,
      fishAfricaSenderId,
      fishAfricaKey,
    )
    return result.sent > 0 ? { sent: true } : { error: result.errors[0] }
  }

  const sentdmKey = process.env.SENTDM_API_KEY || settings.sentdm_api_key
  const smsTemplateId =
    process.env.SENTDM_SMS_TEMPLATE_ID || settings.sentdm_sms_template_id

  if (sentdmKey && smsTemplateId) {
    const result = await sendSentDmMessage(
      phone,
      { id: smsTemplateId, parameters: { message } },
      'sms',
      sentdmKey,
    )
    return result.success ? { sent: true } : { error: result.error }
  }

  console.warn('SMS skipped: no SMS provider configured')
  return { skipped: true }
}
