import type { SupabaseClient } from '@supabase/supabase-js'
import { withCache } from '@/lib/redis/cache'
import {
  parseAdminDashboardStats,
  type AdminDashboardStats,
} from '@/lib/admin/admin-dashboard-stats'

const ADMIN_DASHBOARD_STATS_KEY = 'admin:dashboard:stats'
const ADMIN_DASHBOARD_STATS_TTL_SECONDS = 60

export async function fetchAdminDashboardStats(
  supabase: SupabaseClient,
): Promise<AdminDashboardStats> {
  return withCache(ADMIN_DASHBOARD_STATS_KEY, ADMIN_DASHBOARD_STATS_TTL_SECONDS, async () => {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats')

    if (error) {
      console.error('[admin/dashboard] get_admin_dashboard_stats failed', error)
      return parseAdminDashboardStats(null)
    }

    return parseAdminDashboardStats(data)
  })
}
