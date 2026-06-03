import { createAdminClient } from '@/lib/supabase/admin'

export type MaintenanceSettings = {
  maintenance_full: boolean
  maintenance_portal: boolean
  maintenance_message: string
  maintenance_deadline: string | null
}

const MAINTENANCE_KEYS = [
  'maintenance_full',
  'maintenance_portal',
  'maintenance_message',
  'maintenance_deadline',
] as const

let cache: { fetchedAt: number; settings: MaintenanceSettings } | null = null
const CACHE_TTL_MS = 60_000

function parseBool(value: string | undefined): boolean {
  return value === 'true' || value === '1' || value === 'on'
}

function mapRows(rows: { key: string; value: string | null }[]): MaintenanceSettings {
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value ?? '']))
  const deadlineRaw = map.maintenance_deadline?.trim()
  return {
    maintenance_full: parseBool(map.maintenance_full),
    maintenance_portal: parseBool(map.maintenance_portal),
    maintenance_message: map.maintenance_message?.trim() ?? '',
    maintenance_deadline: deadlineRaw || null,
  }
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.settings
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', [...MAINTENANCE_KEYS])

  const settings = mapRows(data ?? [])
  cache = { fetchedAt: now, settings }
  return settings
}

export function invalidateMaintenanceCache(): void {
  cache = null
}

export function isPortalMaintenancePath(path: string): boolean {
  return path.startsWith('/portal') || path.startsWith('/apply')
}

export function shouldRedirectToMaintenance(
  path: string,
  settings: MaintenanceSettings,
): boolean {
  if (path === '/maintenance' || path.startsWith('/maintenance/')) {
    return false
  }
  if (path.startsWith('/admin')) {
    return false
  }
  if (path === '/login') {
    return false
  }
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/') ||
    path.startsWith('/images/') ||
    path.startsWith('/icons/') ||
    path.startsWith('/favicon') ||
    path.startsWith('/monitoring')
  ) {
    return false
  }

  if (settings.maintenance_full) {
    return true
  }
  if (settings.maintenance_portal && isPortalMaintenancePath(path)) {
    return true
  }
  return false
}
