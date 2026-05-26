import { redis } from '@/lib/redis/client'

const BINDING_TTL_SEC = 30 * 24 * 60 * 60 // 30 days

type SessionBinding = {
  userAgent: string
  ip: string
}

function bindingKey(userId: string): string {
  return `session_bind:${userId}`
}

function normalizeUserAgent(ua: string): string {
  return ua.trim().slice(0, 300)
}

export async function bindSession(
  userId: string,
  ip: string,
  userAgent: string,
): Promise<void> {
  const payload: SessionBinding = {
    ip: ip.slice(0, 64),
    userAgent: normalizeUserAgent(userAgent),
  }
  try {
    await redis.set(bindingKey(userId), JSON.stringify(payload), { ex: BINDING_TTL_SEC })
  } catch (error) {
    console.warn('[session-binding] bind skipped', error)
  }
}

export async function clearSessionBinding(userId: string): Promise<void> {
  try {
    await redis.del(bindingKey(userId))
  } catch (error) {
    console.warn('[session-binding] clear skipped', error)
  }
}

/** Returns false when user-agent changed (possible session hijack). IP-only changes are allowed. */
export async function isSessionBindingValid(
  userId: string,
  ip: string,
  userAgent: string,
): Promise<boolean> {
  void ip

  try {
    const raw = await redis.get<string>(bindingKey(userId))
    if (!raw) return true

    let stored: SessionBinding
    try {
      stored =
        typeof raw === 'string' ? (JSON.parse(raw) as SessionBinding) : (raw as SessionBinding)
    } catch {
      return true
    }

    const ua = normalizeUserAgent(userAgent)
    const bound = normalizeUserAgent(stored.userAgent)

    // Skip strict check when either side has no UA (e.g. server-action vs document request).
    if (!ua || !bound) return true

    if (bound !== ua) {
      return false
    }

    return true
  } catch (error) {
    console.warn('[session-binding] validation skipped', error)
    return true
  }
}
