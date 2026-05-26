import { NextResponse } from 'next/server'
import type { Ratelimit } from '@upstash/ratelimit'
import { checkRateLimit } from '@/lib/redis/ratelimit'

export function getRequestIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous'
  )
}

/**
 * Returns a 429 response if any identifier is over limit; otherwise null.
 */
export async function rateLimitOrNull(
  limiter: Ratelimit,
  identifiers: string[],
  retryAfterSeconds = 3600,
): Promise<NextResponse | null> {
  const uniqueIds = [...new Set(identifiers.filter(Boolean))]
  for (const id of uniqueIds) {
    const { allowed } = await checkRateLimit(limiter, id)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      )
    }
  }
  return null
}
