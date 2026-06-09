import { Redis } from '@upstash/redis'

function parseRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null

  try {
    new URL(url)
  } catch {
    console.error('[redis] UPSTASH_REDIS_REST_URL is not a valid absolute URL')
    return null
  }

  return { url, token }
}

export const isRedisConfigured = parseRedisConfig() !== null

function createDisabledRedisStub(): Redis {
  const noop = async () => null
  const noopOk = async () => 'OK' as const
  const noopZero = async () => 0

  return new Proxy({} as Redis, {
    get(_target, prop) {
      if (prop === 'then') return undefined
      if (prop === 'get' || prop === 'mget') return noop
      if (prop === 'set' || prop === 'setex') return noopOk
      if (prop === 'del') return noopZero
      if (prop === 'exists' || prop === 'expire' || prop === 'ttl') return noopZero
      if (prop === 'incr' || prop === 'decr') return async () => 1
      if (prop === 'pipeline') {
        return () => ({
          exec: async () => [],
        })
      }
      return noop
    },
  })
}

const config = parseRedisConfig()

export const redis: Redis = config
  ? new Redis({ url: config.url, token: config.token })
  : createDisabledRedisStub()
