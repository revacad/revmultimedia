export async function sendFishAfricaSMS(
  phones: string[],
  message: string,
  senderId: string,
  apiKey: string,
): Promise<{ sent: number; errors: string[] }> {
  if (!apiKey) {
    return { sent: 0, errors: ['No API key'] }
  }

  const apiUrl =
    process.env.FISHAFRICA_API_URL ||
    'https://api.letsfish.africa/v1/sms/send'

  const errors: string[] = []
  let sent = 0

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

      if (!response.ok) {
        const body = await response.text()
        errors.push(body || `Fish Africa request failed (${response.status})`)
        continue
      }

      sent += 1
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }

  return { sent, errors }
}
