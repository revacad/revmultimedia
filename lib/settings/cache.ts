import { createAdminClient } from '@/lib/supabase/admin'
import { withCache } from '@/lib/redis/cache'

export async function getSystemSettings(): Promise<Record<string, string>> {
  return withCache('settings:system', 3600, async () => {
    const supabase = createAdminClient()
    const { data } = await supabase.from('system_settings').select('key, value')

    return Object.fromEntries(
      (data ?? []).map((row) => [row.key, row.value ?? '']),
    )
  })
}
