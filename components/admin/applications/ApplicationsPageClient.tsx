'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import ApplicationStatusBadge from '@/components/admin/applications/ApplicationStatusBadge'
import { FILTER_STATUSES } from '@/lib/applications/status'
import { formatApplicationDate, getCountryFlag } from '@/lib/applications/format'
import type { ApplicationListRow, ApplicationStatus } from '@/lib/applications/types'
import { formatCategory } from '@/lib/courses/labels'
import type { CourseCategory } from '@/lib/courses/types'
import { cn } from '@/lib/utils'

interface ApplicationsPageClientProps {
  applications: ApplicationListRow[]
}

export default function ApplicationsPageClient({
  applications,
}: ApplicationsPageClientProps) {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const stats = useMemo(() => {
    const pendingReview = applications.filter(
      (a) => a.status === 'pending' || a.status === 'under_review',
    ).length
    return {
      total: applications.length,
      pendingReview,
      accepted: applications.filter((a) => a.status === 'accepted').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    }
  }, [applications])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return applications.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false
      if (!q) return true
      return (
        app.full_name.toLowerCase().includes(q) ||
        app.real_email.toLowerCase().includes(q) ||
        app.reference.toLowerCase().includes(q)
      )
    })
  }, [applications, statusFilter, search])

  return (
    <div className="mx-auto max-w-[1200px]">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Applications</h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          Review and manage student applications
        </p>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Applications', value: stats.total },
          { label: 'Pending Review', value: stats.pendingReview },
          { label: 'Accepted', value: stats.accepted },
          { label: 'Rejected', value: stats.rejected },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-5 shadow-card">
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-[32px] font-semibold text-[#1A1A2E]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTER_STATUSES.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'rounded-full px-4 py-2 font-body text-[13px] font-semibold transition-colors',
                statusFilter === filter.value
                  ? 'bg-[#C74A86] text-white'
                  : 'border border-[#EFEFF5] bg-[#F7F8FC] text-[#5A5A7A] hover:border-[#D8D8E8]',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or reference..."
          className="w-full rounded-full border-[1.5px] border-[#D8D8E8] bg-white px-4 py-2 font-body text-sm text-[#1A1A2E] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 lg:w-[280px]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#EFEFF5] bg-white py-16 text-center shadow-card">
          <p className="font-body text-base text-[#9898B8]">
            {applications.length === 0
              ? 'No applications yet'
              : 'No applications match your filters'}
          </p>
          <p className="mt-2 font-body text-sm text-[#9898B8]">
            {applications.length === 0
              ? 'Applications submitted through the public form will appear here.'
              : 'Try a different status or search term.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#EFEFF5] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead>
                <tr className="border-b border-[#EFEFF5] bg-[#F7F8FC]">
                  {[
                    'Reference',
                    'Applicant',
                    'Course',
                    'Intake',
                    'Country',
                    'Status',
                    'App Fee',
                    'Date',
                    'Actions',
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-[0.06em] text-[#9898B8]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-[#EFEFF5] transition-colors hover:bg-[#FAFAFA]"
                  >
                    <td className="px-4 py-4 font-mono text-[13px] text-[#C74A86]">
                      {app.reference}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-body text-sm font-semibold text-[#1A1A2E]">
                        {app.full_name}
                      </p>
                      <p className="font-body text-[13px] text-[#9898B8]">{app.real_email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-body text-sm text-[#1A1A2E]">
                        {app.courses?.title ?? '—'}
                      </p>
                      {app.courses?.category && (
                        <div className="mt-1">
                          <Badge variant={app.courses.category as CourseCategory}>
                            {formatCategory(app.courses.category as CourseCategory)}
                          </Badge>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-body text-[13px] text-[#5A5A7A]">
                        {app.intakes?.name ?? '—'}
                      </p>
                      {app.intakes?.start_date && (
                        <p className="font-body text-xs text-[#9898B8]">
                          {formatApplicationDate(app.intakes.start_date)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 font-body text-[13px] text-[#5A5A7A]">
                      <span className="mr-1">{getCountryFlag(app.country)}</span>
                      {app.country}
                    </td>
                    <td className="px-4 py-4">
                      <ApplicationStatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-4">
                      {app.app_fee_paid ? (
                        <span className="inline-flex rounded-full bg-[#EBF9F8] px-3 py-1 font-body text-xs font-semibold text-[#1E9990]">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-[#FDECEC] px-3 py-1 font-body text-xs font-semibold text-[#E84A4A]">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-body text-[13px] text-[#9898B8]">
                      {formatApplicationDate(app.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="font-body text-sm font-semibold text-[#5A5A7A] hover:text-[#1A1A2E]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
