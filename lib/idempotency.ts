import { redis } from '@/lib/redis/client'

const IDEMPOTENCY_TIMEOUT_MS = 3_000

export async function checkIdempotency(
  key: string,
): Promise<{ isDuplicate: boolean; result?: unknown }> {
  try {
    const cached = await Promise.race([
      redis.get(`idempotency:${key}`),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), IDEMPOTENCY_TIMEOUT_MS)
      }),
    ])
    if (cached) {
      return { isDuplicate: true, result: cached }
    }
    return { isDuplicate: false }
  } catch {
    return { isDuplicate: false }
  }
}

export async function storeIdempotencyResult(
  key: string,
  result: unknown,
  ttlSeconds: number = 3600,
): Promise<void> {
  try {
    await redis.set(`idempotency:${key}`, result, { ex: ttlSeconds })
  } catch {
    console.error('Idempotency storage failed for key:', key)
  }
}
