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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

export async function assertPasswordAttemptAllowed(
  identifier: string,
): Promise<{ allowed: true } | { allowed: false }> {
  const ip = ipFromHeaders(await headers())
  const keys = [ip, `id:${identifier.trim().toLowerCase()}`]

  for (const key of keys) {
    try {
      const { allowed } = await withTimeout(checkRateLimit(passwordAttemptLimit, key), 800)
      if (!allowed) {
        return { allowed: false }
      }
    } catch {
      if (process.env.NODE_ENV === 'production') {
        return { allowed: false }
      }
      // Dev: fail open on Redis outage so local login still works.
    }
  }

  return { allowed: true }
}
