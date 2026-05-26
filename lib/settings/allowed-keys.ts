import { MESSAGING_SETTING_KEYS, SETTINGS_TABS } from '@/lib/settings/labels'

const TAB_KEYS = SETTINGS_TABS.flatMap((tab) =>
  tab.sections.flatMap((section) => [...section.keys]),
)

/** Keys that may be updated via `updateSettings`. */
export const ALLOWED_SETTINGS_KEYS = new Set<string>([
  ...TAB_KEYS,
  ...MESSAGING_SETTING_KEYS,
])

export const SETTINGS_VALUE_MAX_LENGTH = 10_000

export function isAllowedSettingsKey(key: string): boolean {
  return ALLOWED_SETTINGS_KEYS.has(key)
}
