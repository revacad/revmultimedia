import SettingsPageClient from '@/components/admin/settings/SettingsPageClient'
import { SETTINGS_SECTIONS } from '@/lib/settings/labels'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Settings — Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
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

  for (const section of SETTINGS_SECTIONS) {
    for (const key of section.keys) {
      if (!(key in values)) {
        values[key] = ''
      }
    }
  }

  for (const key of [
    'sms_provider',
    'sentdm_api_key',
    'sentdm_sender_id',
    'fishafrica_api_key',
    'fishafrica_sender_id',
  ]) {
    if (!(key in values)) {
      values[key] = key === 'sms_provider' ? 'sentdm' : ''
    }
  }

  return <SettingsPageClient values={values} />
}
