import crypto from 'crypto'

export const FISHAFRICA_SIGNATURE_HEADER = 'fishafrica-hmac-signature'

export function getFishAfricaWebhookSignature(request: Request): string | null {
  const value = request.headers.get(FISHAFRICA_SIGNATURE_HEADER)
  return value?.trim() || null
}

export function verifyFishAfricaSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  const computed = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(signature.trim(), 'hex'),
    )
  } catch {
    return false
  }
}
