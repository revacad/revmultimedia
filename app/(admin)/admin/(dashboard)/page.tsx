import Link from 'next/link'
import AdminStatCard from '@/components/admin/AdminStatCard'
import ApplicationStatusBadge from '@/components/admin/applications/ApplicationStatusBadge'
import { formatApplicationDate } from '@/lib/applications/format'
import type { ApplicationStatus } from '@/lib/applications/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession, type AdminRole } from '@/lib/auth/admin'
import { isStaffAdmin } from '@/lib/auth/permissions'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import PaymentClaimsDashboardCard from '@/components/admin/PaymentClaimsDashboardCard'
import { fetchPendingManualPaymentClaims } from '@/lib/payments/manual-claims'
import { fetchAdminDashboardStats } from '@/lib/admin/fetch-admin-dashboard-stats'
import {
  paymentStatsFromDashboard,
  recentApplicationsForDashboard,
} from '@/lib/admin/admin-dashboard-stats'
import { formatGHS } from '@/lib/utils'

export const metadata = {
  title: 'Dashboard - Admin',
}

export const dynamic = 'force-dynamic'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function AdminDashboardPage() {
  await requireAdmin()
  const supabase = createAdminClient()
  const session = await getAdminSession()
  const role: AdminRole = session?.role ?? 'admin'

  const { data: admin } = session
    ? await supabase
        .from('admins')
        .select('full_name')
        .eq('auth_user_id', session.userId)
        .maybeSingle()
    : { data: null }

  const adminFirstName = admin?.full_name?.split(/\s+/)[0] ?? 'Admin'

  const paymentClaims = await fetchPendingManualPaymentClaims(supabase)
  const dashboardStats = await fetchAdminDashboardStats(supabase)
  const paymentStats = paymentStatsFromDashboard(dashboardStats)

  if (!isStaffAdmin(role)) {
    return (
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A2E]">Dashboard</h1>
          <p className="mt-1 font-body text-sm text-[#9898B8]">{formatToday()}</p>
          <p className="mt-1 font-body text-[15px] text-[#5A5A7A]">
            {greeting()}, {adminFirstName}
          </p>
        </header>
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <AdminStatCard
            iconBg="#EBF0FD"
            label="Total Collected"
            value={formatGHS(paymentStats.totalCollected)}
            valueClassName="text-[32px] text-[#1E9990]"
            icon={
              <svg className="h-5 w-5 text-[#4A7BE8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <AdminStatCard
            iconBg="#FEF6EE"
            label="Outstanding (tuition)"
            value={formatGHS(paymentStats.outstanding)}
            valueClassName={
              paymentStats.outstanding > 0 ? 'text-[#E84A4A]' : 'text-[#1E9990]'
            }
            icon={
              <svg className="h-5 w-5 text-[#F18F3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PaymentClaimsDashboardCard pendingCount={paymentClaims.length} />
          <article className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="font-body text-base font-semibold text-[#1A1A2E]">Quick links</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/admin/payments"
                className="rounded-full border border-[#D8D8E8] px-4 py-2 font-body text-sm font-semibold text-[#5A5A7A] hover:border-primary hover:text-primary"
              >
                Payments
              </Link>
              <Link
                href="/admin/payments?tab=claims"
                className="rounded-full border border-[#D8D8E8] px-4 py-2 font-body text-sm font-semibold text-[#5A5A7A] hover:border-primary hover:text-primary"
              >
                Payment claims
                {paymentClaims.length > 0 ? ` (${paymentClaims.length})` : ''}
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-full border border-[#D8D8E8] px-4 py-2 font-body text-sm font-semibold text-[#5A5A7A] hover:border-primary hover:text-primary"
              >
                Reports
              </Link>
              <Link
                href="/admin/communications/logs"
                className="rounded-full border border-[#D8D8E8] px-4 py-2 font-body text-sm font-semibold text-[#5A5A7A] hover:border-primary hover:text-primary"
              >
                Message log
              </Link>
            </div>
          </article>
        </div>
      </div>
    )
  }

  const totalApplications = dashboardStats.total_applications
  const pendingApplications = dashboardStats.pending_applications
  const totalStudents = dashboardStats.total_students
  const recentApplications = recentApplicationsForDashboard(dashboardStats)

  const { data: upcomingIntakes } = await supabase
    .from('intakes')
    .select('*, courses(title, category)')
    .gte('start_date', new Date().toISOString().split('T')[0])
    .eq('is_closed', false)
    .order('start_date', { ascending: true })
    .limit(5)

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="font-display text-[28px] font-semibold text-[#1A1A2E]">Dashboard</h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">{formatToday()}</p>
        <p className="mt-1 font-body text-[15px] text-[#5A5A7A]">
          {greeting()}, {adminFirstName}
        </p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
        <AdminStatCard
          iconBg="#FDF0F6"
          label="Total Applications"
          value={String(totalApplications ?? 0)}
          icon={
            <svg className="h-5 w-5 text-[#C74A86]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <AdminStatCard
          iconBg="#FEF6EE"
          label="Pending Review"
          value={String(pendingApplications ?? 0)}
          valueClassName={(pendingApplications ?? 0) > 0 ? 'text-[#F18F3B]' : undefined}
          icon={
            <svg className="h-5 w-5 text-[#F18F3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <AdminStatCard
          iconBg="#EBF9F8"
          label="Total Students"
          value={String(totalStudents ?? 0)}
          icon={
            <svg className="h-5 w-5 text-[#2DBFB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <AdminStatCard
          iconBg="#EBF0FD"
          label="Total Collected"
          value={formatGHS(paymentStats.totalCollected)}
          valueClassName="text-[32px] text-[#1E9990]"
          icon={
            <svg className="h-5 w-5 text-[#4A7BE8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="mb-8">
        <PaymentClaimsDashboardCard pendingCount={paymentClaims.length} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="font-body text-base font-semibold text-[#1A1A2E]">Outstanding Payments</h2>
          <p
            className={`mt-2 font-display text-2xl font-semibold ${
              paymentStats.outstanding > 0 ? 'text-[#E84A4A]' : 'text-[#1E9990]'
            }`}
          >
            {formatGHS(paymentStats.outstanding)} outstanding
          </p>
          <p className="mt-1 font-body text-sm text-[#9898B8]">
            Unpaid and partially paid tuition invoices
          </p>
          <Link href="/admin/payments" className="mt-4 inline-block font-body text-sm font-semibold text-primary">
            View all
          </Link>
        </article>

        <article className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/admin/intakes/new"
              className="block w-full rounded-full border border-[#D8D8E8] px-4 py-2.5 text-center font-body text-sm font-semibold text-[#5A5A7A] hover:border-primary hover:text-primary"
            >
              New Intake
            </Link>
            <Link
              href="/admin/courses/new"
              className="block w-full rounded-full border border-[#D8D8E8] px-4 py-2.5 text-center font-body text-sm font-semibold text-[#5A5A7A] hover:border-primary hover:text-primary"
            >
              New Course
            </Link>
            <Link
              href="/admin/payments"
              className="block w-full rounded-full border border-[#D8D8E8] px-4 py-2.5 text-center font-body text-sm font-semibold text-[#5A5A7A] hover:border-primary hover:text-primary"
            >
              View Payments
            </Link>
            <Link
              href="/admin/payments?tab=claims"
              className="block w-full rounded-full border border-[#D8D8E8] px-4 py-2.5 text-center font-body text-sm font-semibold text-[#5A5A7A] hover:border-primary hover:text-primary"
            >
              Payment claims
              {paymentClaims.length > 0 ? ` (${paymentClaims.length} pending)` : ''}
            </Link>
            <Link
              href="/admin/settings"
              className="block w-full rounded-full border border-[#D8D8E8] px-4 py-2.5 text-center font-body text-sm font-semibold text-[#5A5A7A] hover:border-primary hover:text-primary"
            >
              Settings
            </Link>
          </div>
        </article>
      </div>

      <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-body text-base font-semibold text-[#1A1A2E]">Recent Applications</h2>
          <Link href="/admin/applications" className="font-body text-sm font-semibold text-primary">
            View all
          </Link>
        </div>
        {(recentApplications ?? []).length === 0 ? (
          <p className="font-body text-sm text-[#9898B8]">No applications yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#EFEFF5] font-body text-xs uppercase text-[#9898B8]">
                  <th className="pb-3 pr-4">Reference</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Course</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {(recentApplications ?? []).map((app) => {
                  const rawCourse = app.courses as { title: string } | { title: string }[] | null
                  const course = Array.isArray(rawCourse) ? rawCourse[0] : rawCourse
                  return (
                    <tr key={app.id} className="border-b border-[#EFEFF5] last:border-0">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {app.reference}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-body text-[#1A1A2E]">{app.full_name}</td>
                      <td className="py-3 pr-4 font-body text-[#5A5A7A]">{course?.title ?? '-'}</td>
                      <td className="py-3 pr-4">
                        <ApplicationStatusBadge status={app.status as ApplicationStatus} />
                      </td>
                      <td className="py-3 font-body text-[#9898B8]">
                        {formatApplicationDate(app.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-body text-base font-semibold text-[#1A1A2E]">Upcoming Intakes</h2>
          <Link href="/admin/intakes" className="font-body text-sm font-semibold text-primary">
            Manage
          </Link>
        </div>
        {(upcomingIntakes ?? []).length === 0 ? (
          <p className="font-body text-sm text-[#9898B8]">No upcoming intakes</p>
        ) : (
          <ul className="divide-y divide-[#EFEFF5]">
            {(upcomingIntakes ?? []).map((intake) => {
              const rawCourse = intake.courses as
                | { title: string; category: string }
                | { title: string; category: string }[]
                | null
              const course = Array.isArray(rawCourse) ? rawCourse[0] : rawCourse
              const maxSlots = intake.max_slots ?? 0
              const enrolled = intake.enrolled_count ?? 0
              const remaining = Math.max(0, maxSlots - enrolled)

              return (
                <li key={intake.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-body text-sm font-semibold text-[#1A1A2E]">
                      {course?.title ?? 'Course'}
                    </p>
                    <p className="font-body text-xs text-[#9898B8]">{intake.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm text-[#5A5A7A]">
                      {formatApplicationDate(intake.start_date)}
                    </p>
                    <span className="mt-1 inline-flex rounded-full bg-[#F0F0F8] px-2.5 py-0.5 font-body text-xs font-semibold text-[#5A5A7A]">
                      {remaining} slots left
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
