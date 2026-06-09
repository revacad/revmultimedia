export type AdminDashboardRecentApplication = {
  id: string
  reference: string
  status: string
  created_at: string
  student_name: string
  course_title: string | null
}

export type AdminDashboardRevenueMonth = {
  month: string
  total_ghs: number
}

export type AdminDashboardStats = {
  total_applications: number
  pending_applications: number
  total_students: number
  total_revenue_ghs: number
  outstanding_tuition_ghs: number
  pending_payments_count: number
  recent_applications: AdminDashboardRecentApplication[] | null
  revenue_by_month: AdminDashboardRevenueMonth[] | null
}

const EMPTY_STATS: AdminDashboardStats = {
  total_applications: 0,
  pending_applications: 0,
  total_students: 0,
  total_revenue_ghs: 0,
  outstanding_tuition_ghs: 0,
  pending_payments_count: 0,
  recent_applications: [],
  revenue_by_month: [],
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return 0
}

function mapRecentApplication(row: Record<string, unknown>): AdminDashboardRecentApplication {
  return {
    id: String(row.id),
    reference: String(row.reference ?? ''),
    status: String(row.status ?? ''),
    created_at: String(row.created_at ?? ''),
    student_name: String(row.student_name ?? ''),
    course_title: row.course_title != null ? String(row.course_title) : null,
  }
}

function mapRevenueMonth(row: Record<string, unknown>): AdminDashboardRevenueMonth {
  return {
    month: String(row.month ?? ''),
    total_ghs: toNumber(row.total_ghs),
  }
}

export function parseAdminDashboardStats(raw: unknown): AdminDashboardStats {
  if (!raw || typeof raw !== 'object') {
    return EMPTY_STATS
  }

  const data = raw as Record<string, unknown>
  const recentRaw = data.recent_applications
  const revenueRaw = data.revenue_by_month

  return {
    total_applications: toNumber(data.total_applications),
    pending_applications: toNumber(data.pending_applications),
    total_students: toNumber(data.total_students),
    total_revenue_ghs: toNumber(data.total_revenue_ghs),
    outstanding_tuition_ghs: toNumber(data.outstanding_tuition_ghs),
    pending_payments_count: toNumber(data.pending_payments_count),
    recent_applications: Array.isArray(recentRaw)
      ? recentRaw.map((row) => mapRecentApplication(row as Record<string, unknown>))
      : [],
    revenue_by_month: Array.isArray(revenueRaw)
      ? revenueRaw.map((row) => mapRevenueMonth(row as Record<string, unknown>))
      : [],
  }
}

export function recentApplicationsForDashboard(stats: AdminDashboardStats) {
  return (stats.recent_applications ?? []).map((row) => ({
    id: row.id,
    reference: row.reference,
    full_name: row.student_name,
    status: row.status,
    created_at: row.created_at,
    courses: row.course_title ? { title: row.course_title } : null,
  }))
}

export function paymentStatsFromDashboard(stats: AdminDashboardStats) {
  return {
    totalCollected: stats.total_revenue_ghs,
    outstanding: stats.outstanding_tuition_ghs,
    paidThisMonth: 0,
    pendingCount: stats.pending_payments_count,
  }
}
