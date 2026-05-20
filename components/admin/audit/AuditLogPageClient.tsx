'use client'

import { Fragment, useMemo, useState } from 'react'
import { formatPaymentDateTime } from '@/lib/payments/format'

export type AuditLogRow = {
  id: string
  admin_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  old_value: unknown
  new_value: unknown
  created_at: string
  admins: { full_name: string; email: string } | null
  students: { full_name: string; student_id: string } | null
}

type AdminOption = { id: string; full_name: string }

const ACTION_COLORS: Array<{ prefix: string; className: string }> = [
  { prefix: 'application.', className: 'bg-[#EBF0FD] text-[#4A7BE8]' },
  { prefix: 'payment.', className: 'bg-[#EBF9F8] text-[#1E9990]' },
  { prefix: 'invoice.', className: 'bg-[#FEF6EE] text-[#C4701E]' },
  { prefix: 'auth.', className: 'bg-[#F3EEFF] text-[#7B5AE8]' },
  { prefix: 'settings.', className: 'bg-[#FDECEC] text-[#E84A4A]' },
  { prefix: 'course.', className: 'bg-[#EBF9F8] text-[#1E9990]' },
  { prefix: 'admin.', className: 'bg-[#F0F0F8] text-[#5A5A7A]' },
]

function actionBadgeClass(action: string): string {
  const match = ACTION_COLORS.find((c) => action.startsWith(c.prefix))
  return match?.className ?? 'bg-[#F0F0F8] text-[#5A5A7A]'
}

function truncateId(id: string | null): string {
  if (!id) return '—'
  return id.length > 8 ? `${id.slice(0, 8)}…` : id
}

interface AuditLogPageClientProps {
  logs: AuditLogRow[]
  admins: AdminOption[]
  actionTypes: string[]
}

export default function AuditLogPageClient({
  logs,
  admins,
  actionTypes,
}: AuditLogPageClientProps) {
  const [actionFilter, setActionFilter] = useState('')
  const [adminFilter, setAdminFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return logs.filter((row) => {
      if (actionFilter && row.action !== actionFilter) return false
      if (adminFilter === 'system' && row.admin_id) return false
      if (adminFilter && adminFilter !== 'system' && row.admin_id !== adminFilter) return false
      if (dateFrom && row.created_at < `${dateFrom}T00:00:00`) return false
      if (dateTo && row.created_at > `${dateTo}T23:59:59`) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = [
          row.action,
          row.entity_type,
          row.entity_id,
          JSON.stringify(row.new_value),
          JSON.stringify(row.old_value),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [logs, actionFilter, adminFilter, dateFrom, dateTo, search, admins])

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Audit Log</h1>
          <p className="mt-1 font-body text-sm text-[#9898B8]">System activity and admin actions</p>
        </div>
        <span className="rounded-full bg-[#FDF0F6] px-3 py-1 font-body text-xs font-semibold text-primary">
          Superadmin only
        </span>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block font-body text-xs font-semibold text-[#9898B8]">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full rounded-lg border border-[#EFEFF5] px-3 py-2 font-body text-sm"
          >
            <option value="">All actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-body text-xs font-semibold text-[#9898B8]">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg border border-[#EFEFF5] px-3 py-2 font-body text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block font-body text-xs font-semibold text-[#9898B8]">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg border border-[#EFEFF5] px-3 py-2 font-body text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block font-body text-xs font-semibold text-[#9898B8]">Admin</label>
          <select
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value)}
            className="w-full rounded-lg border border-[#EFEFF5] px-3 py-2 font-body text-sm"
          >
            <option value="">All admins</option>
            <option value="system">System</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-body text-xs font-semibold text-[#9898B8]">Search</label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Entity ID or keyword"
            className="w-full rounded-lg border border-[#EFEFF5] px-3 py-2 font-body text-sm"
          />
        </div>
      </div>

      <section className="overflow-x-auto rounded-xl bg-white shadow-card">
        <table className="w-full min-w-[800px] text-left font-body text-sm">
          <thead>
            <tr className="border-b border-[#EFEFF5] px-4 text-xs uppercase text-[#9898B8]">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#9898B8]">
                  No log entries match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <Fragment key={row.id}>
                  <tr className="border-b border-[#EFEFF5]">
                    <td className="px-4 py-3 font-mono text-xs text-[#5A5A7A]">
                      {formatPaymentDateTime(row.created_at)}
                    </td>
                    <td className="px-4 py-3 text-[#1A1A2E]">
                      {row.admins?.full_name ?? 'System'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionBadgeClass(row.action)}`}
                      >
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5A5A7A]">
                      {row.entity_type ? `${row.entity_type} ` : ''}
                      {truncateId(row.entity_id)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expandedId === row.id ? null : row.id)
                        }
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {expandedId === row.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === row.id && (
                    <tr className="bg-[#F7F8FC]">
                      <td colSpan={5} className="px-4 py-3">
                        <pre className="max-h-48 overflow-auto font-mono text-xs text-[#5A5A7A]">
                          {JSON.stringify(
                            { old: row.old_value, new: row.new_value },
                            null,
                            2,
                          )}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
