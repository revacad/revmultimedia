import { createAdminClient } from '@/lib/supabase/admin'

export async function getPaymentSettings(): Promise<Record<string, string>> {
  const admin = createAdminClient()
  const { data } = await admin.from('system_settings').select('key, value')

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    map[row.key] = row.value
  }
  return map
}
