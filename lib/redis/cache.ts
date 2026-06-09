import { redis, isRedisConfigured } from '@/lib/redis/client'
import { formatRedisError } from '@/lib/redis/errors'

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (isRedisConfigured) {
    try {
      const cached = await redis.get<T>(key)
      if (cached !== null && cached !== undefined) {
        return cached
      }
    } catch (error) {
      console.error('[redis:cache] read failed', key, formatRedisError(error))
    }
  }

  const value = await fetcher()

  if (isRedisConfigured) {
    try {
      await redis.set(key, value, { ex: ttlSeconds })
    } catch (error) {
      console.error('[redis:cache] write failed', key, formatRedisError(error))
    }
  }

  return value
}
