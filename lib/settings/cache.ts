import { redis } from '@/lib/redis/client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getSystemSettings(): Promise<Record<string, string>> {
  const cached = await redis.get<Record<string, string>>('settings:system')
  if (cached) return cached

  const supabase = createAdminClient()
  const { data } = await supabase.from('system_settings').select('key, value')

  const settings = Object.fromEntries(
    (data ?? []).map((row) => [row.key, row.value ?? '']),
  )

  await redis.set('settings:system', settings, { ex: 3600 })

  return settings
}
