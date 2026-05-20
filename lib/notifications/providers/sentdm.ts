export interface SentDmTemplate {
  id: string
  parameters?: Record<string, string>
}

export async function sendSentDmMessage(
  phone: string | string[],
  template: SentDmTemplate,
  channel: 'sms' | 'whatsapp',
  apiKey: string,
): Promise<{ success: boolean; error?: string }> {
  if (!apiKey) return { success: false, error: 'No API key' }

  const recipients = Array.isArray(phone) ? phone : [phone]

  try {
    const response = await fetch('https://api.sent.dm/v3/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        to: recipients,
        template: {
          id: template.id,
          parameters: template.parameters || {},
        },
        channel: [channel],
      }),
    })

    const data = (await response.json()) as {
      success?: boolean
      error?: { message?: string }
    }

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data?.error?.message || 'Sent.dm error',
      }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
