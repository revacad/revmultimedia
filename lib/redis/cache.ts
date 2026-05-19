import { redis } from "@/lib/redis/client";

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch (error) {
    console.error("[redis:cache] read failed", { key, error });
  }

  const value = await fetcher();

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error("[redis:cache] write failed", { key, error });
  }

  return value;
}
