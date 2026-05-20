'use client'

import { useTransition } from 'react'
import Button from '@/components/ui/Button'
import CsvExportButton from '@/components/admin/reports/CsvExportButton'
import { formatCategory } from '@/lib/courses/labels'
import type { CourseCategory } from '@/lib/courses/types'
import { formatGHS } from '@/lib/utils'
import {
  exportApplicationsCSV,
  exportEnrollmentsCSV,
  exportPaymentsCSV,
  exportStudentsCSV,
} from '@/actions/reports'

export type FunnelStep = {
  key: string
  label: string
  count: number
  bg: string
  fill: string
  separate?: boolean
}

export type RevenueMonth = {
  key: string
  label: string
  amount: number
}

export type EnrollmentCourseRow = {
  title: string
  category: CourseCategory
  active: number
  completed: number
  total: number
}

export type CountryRow = {
  country: string
  count: number
  percent: number
}

interface ReportsPageClientProps {
  totalRevenue: number
  totalAppFees: number
  activeEnrollments: number
  conversionRate: number
  funnel: FunnelStep[]
  funnelTotal: number
  revenueMonths: RevenueMonth[]
  maxRevenue: number
  enrollmentRows: EnrollmentCourseRow[]
  countryRows: CountryRow[]
}

export default function ReportsPageClient({
  totalRevenue,
  totalAppFees,
  activeEnrollments,
  conversionRate,
  funnel,
  funnelTotal,
  revenueMonths,
  maxRevenue,
  enrollmentRows,
  countryRows,
}: ReportsPageClientProps) {
  const [pending, startTransition] = useTransition()

  function handleExportApplications() {
    startTransition(async () => {
      const csv = await exportApplicationsCSV()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'applications.csv'
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Reports</h1>
          <p className="mt-1 font-body text-sm text-[#9898B8]">Analytics and data exports</p>
        </div>
        <Button
          type="button"
          variant="primary"
          disabled={pending}
          onClick={handleExportApplications}
        >
          {pending ? 'Exporting…' : 'Export CSV'}
        </Button>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: formatGHS(totalRevenue) },
          { label: 'Total App Fees', value: formatGHS(totalAppFees) },
          { label: 'Total Enrollments', value: String(activeEnrollments) },
          { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%` },
        ].map((card) => (
          <article key={card.label} className="rounded-xl bg-white p-6 shadow-card">
            <p className="font-display text-2xl font-semibold text-[#1A1A2E]">{card.value}</p>
            <p className="mt-1 font-body text-[13px] uppercase tracking-wide text-[#9898B8]">
              {card.label}
            </p>
          </article>
        ))}
      </div>

      <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-6 font-body text-base font-semibold text-[#1A1A2E]">Application Funnel</h2>
        <div className="space-y-4">
          {funnel.map((step) => {
            const pct = funnelTotal > 0 ? (step.count / funnelTotal) * 100 : 0
            const width = step.key === 'applied' ? 100 : Math.max(pct, step.count > 0 ? 8 : 0)

            if (step.separate) {
              return (
                <p key={step.key} className="font-body text-sm text-[#E84A4A]">
                  {step.label}: {step.count} ({pct.toFixed(0)}%)
                </p>
              )
            }

            return (
              <div key={step.key}>
                <div className="mb-1 flex justify-between font-body text-sm">
                  <span className="text-[#1A1A2E]">{step.label}</span>
                  <span className="text-[#9898B8]">
                    {step.count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full" style={{ backgroundColor: step.bg }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${width}%`, backgroundColor: step.fill }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-6 font-body text-base font-semibold text-[#1A1A2E]">Revenue Overview</h2>
        {revenueMonths.every((m) => m.amount === 0) ? (
          <p className="py-8 text-center font-body text-sm text-[#9898B8]">No revenue data yet</p>
        ) : (
          <div className="flex h-48 items-end justify-between gap-3">
            {revenueMonths.map((month) => {
              const barHeight =
                maxRevenue > 0 ? Math.max(4, (month.amount / maxRevenue) * 160) : 0
              return (
                <div key={month.key} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full rounded-t bg-[#C74A86]"
                    style={{ height: `${barHeight}px` }}
                  />
                  <p className="text-center font-body text-xs text-[#9898B8]">{month.label}</p>
                  <p className="text-center font-body text-xs font-semibold text-[#1A1A2E]">
                    {formatGHS(month.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Enrollments by Course</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#EFEFF5] text-xs uppercase text-[#9898B8]">
                <th className="pb-3 pr-4">Course</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Active</th>
                <th className="pb-3 pr-4">Completed</th>
                <th className="pb-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {enrollmentRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#9898B8]">
                    No enrollment data
                  </td>
                </tr>
              ) : (
                enrollmentRows.map((row) => (
                  <tr key={row.title} className="border-b border-[#EFEFF5] last:border-0">
                    <td className="py-3 pr-4 font-medium text-[#1A1A2E]">{row.title}</td>
                    <td className="py-3 pr-4 text-[#5A5A7A]">{formatCategory(row.category)}</td>
                    <td className="py-3 pr-4">{row.active}</td>
                    <td className="py-3 pr-4">{row.completed}</td>
                    <td className="py-3">{row.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Applications by Country</h2>
        <ul className="space-y-3">
          {countryRows.map((row) => (
            <li key={row.country}>
              <div className="mb-1 flex justify-between font-body text-sm">
                <span className="text-[#1A1A2E]">{row.country}</span>
                <span className="text-[#9898B8]">
                  {row.count} ({row.percent.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#EFEFF5]">
                <div
                  className="h-full rounded-full bg-[#C74A86]"
                  style={{ width: `${row.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Export Data</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CsvExportButton
            label="Export Applications"
            filename="applications.csv"
            exportFn={exportApplicationsCSV}
          />
          <CsvExportButton
            label="Export Students"
            filename="students.csv"
            exportFn={exportStudentsCSV}
          />
          <CsvExportButton
            label="Export Payments"
            filename="payments.csv"
            exportFn={exportPaymentsCSV}
          />
          <CsvExportButton
            label="Export Enrollments"
            filename="enrollments.csv"
            exportFn={exportEnrollmentsCSV}
          />
        </div>
      </section>
    </div>
  )
}
