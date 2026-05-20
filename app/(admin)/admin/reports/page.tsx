import ReportsPageClient, {
  type CountryRow,
  type EnrollmentCourseRow,
  type FunnelStep,
  type RevenueMonth,
} from '@/components/admin/reports/ReportsPageClient'
import type { CourseCategory } from '@/lib/courses/types'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Reports — Admin',
}

export const dynamic = 'force-dynamic'

function lastSixMonths(): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    months.push({ key, label })
  }
  return months
}

export default async function AdminReportsPage() {
  const supabase = createAdminClient()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [
    { data: revenueByMonth },
    { data: enrollmentsByCourse },
    { data: funnelData },
    { data: countryData },
    { data: allTuitionPaid },
    { data: allAppFeesPaid },
    { count: totalApplications },
    { count: acceptedApplications },
    { count: enrolledCount },
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select('total_ghs, created_at, type')
      .eq('status', 'paid')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase.from('enrollments').select('status, courses(title, category)'),
    supabase.from('applications').select('status'),
    supabase.from('applications').select('country'),
    supabase.from('invoices').select('total_ghs').eq('status', 'paid').eq('type', 'tuition'),
    supabase.from('invoices').select('total_ghs').eq('status', 'paid').eq('type', 'application_fee'),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('students').select('*', { count: 'exact', head: true }),
  ])

  const totalRevenue =
    allTuitionPaid?.reduce((sum, inv) => sum + Number(inv.total_ghs), 0) ?? 0
  const totalAppFees =
    allAppFeesPaid?.reduce((sum, inv) => sum + Number(inv.total_ghs), 0) ?? 0
  const activeEnrollments =
    enrollmentsByCourse?.filter((e) => e.status === 'active').length ?? 0
  const conversionRate =
    (totalApplications ?? 0) > 0
      ? ((acceptedApplications ?? 0) / (totalApplications ?? 1)) * 100
      : 0

  const statusCounts: Record<string, number> = {}
  for (const row of funnelData ?? []) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1
  }

  const funnelTotal = funnelData?.length ?? 0
  const funnel: FunnelStep[] = [
    {
      key: 'applied',
      label: 'Applied',
      count: funnelTotal,
      bg: '#EFEFF5',
      fill: '#1A1A2E',
    },
    {
      key: 'shortlisted',
      label: 'Shortlisted',
      count: statusCounts.shortlisted ?? 0,
      bg: '#FEF6EE',
      fill: '#F18F3B',
    },
    {
      key: 'accepted',
      label: 'Accepted',
      count: statusCounts.accepted ?? 0,
      bg: '#EBF9F8',
      fill: '#2DBFB8',
    },
    {
      key: 'enrolled',
      label: 'Enrolled',
      count: enrolledCount ?? 0,
      bg: '#FDF0F6',
      fill: '#C74A86',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      count: statusCounts.rejected ?? 0,
      bg: '#FDECEC',
      fill: '#E84A4A',
      separate: true,
    },
  ]

  const monthBuckets = new Map<string, number>()
  for (const m of lastSixMonths()) {
    monthBuckets.set(m.key, 0)
  }
  for (const inv of revenueByMonth ?? []) {
    if (inv.type !== 'tuition') continue
    const d = new Date(inv.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthBuckets.has(key)) {
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + Number(inv.total_ghs))
    }
  }

  const revenueMonths: RevenueMonth[] = lastSixMonths().map((m) => ({
    key: m.key,
    label: m.label,
    amount: monthBuckets.get(m.key) ?? 0,
  }))
  const maxRevenue = Math.max(...revenueMonths.map((m) => m.amount), 1)

  const courseMap = new Map<string, EnrollmentCourseRow>()
  for (const row of enrollmentsByCourse ?? []) {
    const rawCourse = row.courses as
      | { title: string; category: CourseCategory }
      | { title: string; category: CourseCategory }[]
      | null
    const course = Array.isArray(rawCourse) ? rawCourse[0] : rawCourse
    if (!course) continue
    const existing = courseMap.get(course.title) ?? {
      title: course.title,
      category: course.category,
      active: 0,
      completed: 0,
      total: 0,
    }
    existing.total += 1
    if (row.status === 'active') existing.active += 1
    if (row.status === 'completed') existing.completed += 1
    courseMap.set(course.title, existing)
  }
  const enrollmentRows = [...courseMap.values()].sort((a, b) => b.total - a.total)

  const countryCounts = new Map<string, number>()
  for (const row of countryData ?? []) {
    countryCounts.set(row.country, (countryCounts.get(row.country) ?? 0) + 1)
  }
  const countryTotal = countryData?.length ?? 0
  const countryRows: CountryRow[] = [...countryCounts.entries()].map(([country, count]) => ({
    country,
    count,
    percent: countryTotal > 0 ? (count / countryTotal) * 100 : 0,
  }))
  countryRows.sort((a, b) => {
    if (a.country === 'Ghana') return -1
    if (b.country === 'Ghana') return 1
    return b.count - a.count
  })

  return (
    <ReportsPageClient
      totalRevenue={totalRevenue}
      totalAppFees={totalAppFees}
      activeEnrollments={activeEnrollments}
      conversionRate={conversionRate}
      funnel={funnel}
      funnelTotal={funnelTotal}
      revenueMonths={revenueMonths}
      maxRevenue={maxRevenue}
      enrollmentRows={enrollmentRows}
      countryRows={countryRows}
    />
  )
}
