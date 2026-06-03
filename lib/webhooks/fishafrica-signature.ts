import { createHmac, timingSafeEqual } from 'crypto'

const SIGNATURE_HEADERS = [
  'x-fishafrica-signature',
  'x-webhook-signature',
  'x-signature',
] as const

function normalizeSignature(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('sha256=')) {
    return trimmed.slice('sha256='.length)
  }
  return trimmed
}

export function getFishAfricaWebhookSignature(request: Request): string | null {
  for (const header of SIGNATURE_HEADERS) {
    const value = request.headers.get(header)
    if (value?.trim()) {
      return normalizeSignature(value)
    }
  }
  return null
}

export function verifyFishAfricaWebhookSignature(
  rawBody: string,
  secret: string,
  signature: string,
): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')

  try {
    const expectedBuffer = Buffer.from(expected, 'utf8')
    const signatureBuffer = Buffer.from(signature, 'utf8')
    if (expectedBuffer.length !== signatureBuffer.length) {
      return false
    }
    return timingSafeEqual(expectedBuffer, signatureBuffer)
  } catch {
    return false
  }
}
