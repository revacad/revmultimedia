import { headers } from 'next/headers'
import { checkRateLimit, passwordAttemptLimit } from '@/lib/redis/ratelimit'

/** 5 password attempts per minute per IP and per identifier (email / login id). */
function ipFromHeaders(headersList: Headers): string {
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'anonymous'
  )
}

export async function assertPasswordAttemptAllowed(
  identifier: string,
): Promise<{ allowed: true } | { allowed: false }> {
  const ip = ipFromHeaders(await headers())
  const keys = [ip, `id:${identifier.trim().toLowerCase()}`]

  for (const key of keys) {
    const { allowed } = await checkRateLimit(passwordAttemptLimit, key)
    if (!allowed) {
      return { allowed: false }
    }
  }

  return { allowed: true }
}
