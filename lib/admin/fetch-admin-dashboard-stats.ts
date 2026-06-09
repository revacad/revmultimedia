import type { SupabaseClient } from '@supabase/supabase-js'
import {
  parseAdminDashboardStats,
  type AdminDashboardStats,
} from '@/lib/admin/admin-dashboard-stats'

export async function fetchAdminDashboardStats(
  supabase: SupabaseClient,
): Promise<AdminDashboardStats> {
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats')

  if (error) {
    console.error('[admin/dashboard] get_admin_dashboard_stats failed', error)
    return parseAdminDashboardStats(null)
  }

  return parseAdminDashboardStats(data)
}
