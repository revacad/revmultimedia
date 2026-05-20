import SettingsPageClient from '@/components/admin/settings/SettingsPageClient'
import { requireSuperAdmin } from '@/lib/auth/requireAdmin'
import { MESSAGING_SETTING_KEYS, SETTINGS_TABS } from '@/lib/settings/labels'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Settings — Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  await requireSuperAdmin()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .order('key')

  if (error) {
    console.error('[admin/settings] fetch failed', error)
  }

  const values: Record<string, string> = {}
  for (const row of data ?? []) {
    values[row.key] = row.value ?? ''
  }

  for (const tab of SETTINGS_TABS) {
    for (const section of tab.sections) {
      for (const key of section.keys) {
        if (!(key in values)) {
          values[key] = ''
        }
      }
    }
  }

  for (const key of MESSAGING_SETTING_KEYS) {
    if (!(key in values)) {
      values[key] = key === 'sms_provider' ? 'sentdm' : ''
    }
  }

  return <SettingsPageClient values={values} />
}
