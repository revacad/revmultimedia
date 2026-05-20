function extractMessageId(payload: Record<string, unknown>): string | null {
  if (typeof payload.message_id === 'string') return payload.message_id
  if (typeof payload.id === 'string') return payload.id

  const data = payload.data
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === 'object') {
        const row = item as Record<string, unknown>
        if (typeof row.message_id === 'string') return row.message_id
        if (typeof row.id === 'string') return row.id
      }
    }
  } else if (data && typeof data === 'object') {
    const row = data as Record<string, unknown>
    if (typeof row.message_id === 'string') return row.message_id
    if (typeof row.id === 'string') return row.id
  }

  return null
}

export async function sendFishAfricaSMS(
  phones: string[],
  message: string,
  senderId: string,
  apiKey: string,
): Promise<{
  sent: number
  failed: number
  errors: string[]
  messageIds: string[]
}> {
  if (!apiKey) {
    return { sent: 0, failed: phones.length, errors: ['No API key'], messageIds: [] }
  }

  const apiUrl =
    process.env.FISHAFRICA_API_URL ||
    'https://api.letsfish.africa/v1/sms/send'

  const errors: string[] = []
  const messageIds: string[] = []
  let sent = 0
  let failed = 0

  for (const phone of phones) {
    try {
      const response = await fetch(apiUrl, {
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
      })

      const responseText = await response.text()

      if (
        responseText.includes('cloudflare') ||
        responseText.includes('<!DOCTYPE') ||
        responseText.includes('<html')
      ) {
        console.error(
          'Fish Africa SMS blocked by Cloudflare WAF.',
          'Contact Fish Africa to whitelist Vercel IP ranges.',
          'Skipping SMS delivery.',
        )
        return {
          sent: 0,
          failed: phones.length,
          errors: ['Cloudflare WAF block — contact Fish Africa support'],
          messageIds: [],
        }
      }

      if (!response.ok) {
        errors.push(responseText || `Fish Africa request failed (${response.status})`)
        failed += 1
        continue
      }

      let data: Record<string, unknown>
      try {
        data = JSON.parse(responseText) as Record<string, unknown>
      } catch {
        console.error('Fish Africa non-JSON response:', responseText.slice(0, 200))
        return {
          sent: 0,
          failed: phones.length,
          errors: ['Invalid response from Fish Africa'],
          messageIds: [],
        }
      }

      let messageId: string | null = extractMessageId(data)
      const results = Array.isArray(data.data) ? data.data : []
      for (const item of results) {
        if (item && typeof item === 'object') {
          const row = item as Record<string, unknown>
          const id =
            (typeof row.message_id === 'string' && row.message_id) ||
            (typeof row.id === 'string' && row.id) ||
            null
          if (id) {
            messageId = id
            break
          }
        }
      }

      sent += 1
      if (messageId) {
        messageIds.push(messageId)
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
      failed += 1
    }
  }

  return { sent, failed, errors, messageIds }
}
