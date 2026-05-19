'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import InvoiceStatusBadge from '@/components/admin/payments/InvoiceStatusBadge'
import InvoiceTypeBadge from '@/components/admin/payments/InvoiceTypeBadge'
import {
  formatAmountGhs,
  formatPaymentDate,
  isOverdue,
  sumInstallments,
} from '@/lib/payments/format'
import type { InvoiceStatus, InvoiceType, PaymentListRow } from '@/lib/payments/types'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: { value: InvoiceStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'waived', label: 'Waived' },
]

const TYPE_FILTERS: { value: InvoiceType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'application_fee', label: 'Application Fee' },
  { value: 'tuition', label: 'Tuition' },
]

interface PaymentsPageClientProps {
  invoices: PaymentListRow[]
}

export default function PaymentsPageClient({ invoices }: PaymentsPageClientProps) {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'all'>('all')

  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    let totalRevenue = 0
    let outstanding = 0
    let paidThisMonth = 0
    let pendingCount = 0

    for (const inv of invoices) {
      const paid = sumInstallments(inv.installments)
      if (inv.status === 'paid') {
        totalRevenue += inv.total_ghs
        if (new Date(inv.updated_at) >= monthStart) {
          paidThisMonth += inv.total_ghs
        }
      } else if (inv.status === 'unpaid' || inv.status === 'partially_paid') {
        outstanding += Math.max(0, inv.total_ghs - paid)
        pendingCount += 1
      }
    }

    return { totalRevenue, outstanding, paidThisMonth, pendingCount }
  }, [invoices])

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false
      if (typeFilter !== 'all' && inv.type !== typeFilter) return false
      return true
    })
  }, [invoices, statusFilter, typeFilter])

  return (
    <div className="mx-auto max-w-[1200px]">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Payment Tracker</h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          Track MoMo and bank transfer payments
        </p>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue (GHS)', value: formatAmountGhs(stats.totalRevenue) },
          { label: 'Outstanding', value: formatAmountGhs(stats.outstanding) },
          { label: 'Paid this month', value: formatAmountGhs(stats.paidThisMonth) },
          { label: 'Pending payment', value: String(stats.pendingCount) },
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

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'rounded-full px-4 py-2 font-body text-[13px] font-semibold transition-colors',
                statusFilter === filter.value
                  ? 'bg-[#C74A86] text-white'
                  : 'border border-[#EFEFF5] bg-[#F7F8FC] text-[#5A5A7A]',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              className={cn(
                'rounded-full px-4 py-2 font-body text-[13px] font-semibold transition-colors',
                typeFilter === filter.value
                  ? 'bg-[#4A7BE8] text-white'
                  : 'border border-[#EFEFF5] bg-[#F7F8FC] text-[#5A5A7A]',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#EFEFF5] bg-white py-16 text-center shadow-card">
          <p className="font-body text-base text-[#9898B8]">No invoices found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#EFEFF5] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead>
                <tr className="border-b border-[#EFEFF5] bg-[#F7F8FC]">
                  {[
                    'Invoice Ref',
                    'Applicant',
                    'Type',
                    'Amount',
                    'Due Date',
                    'Status',
                    'Paid',
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
                {filtered.map((inv) => {
                  const paid = sumInstallments(inv.installments)
                  const progress = inv.total_ghs > 0 ? Math.min(100, (paid / inv.total_ghs) * 100) : 0
                  const overdue = isOverdue(inv.due_date, inv.status)

                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-[#EFEFF5] hover:bg-[#FAFAFA]"
                    >
                      <td className="px-4 py-4 font-mono text-[13px] text-[#C74A86]">
                        {inv.reference}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body text-sm font-semibold text-[#1A1A2E]">
                          {inv.applications?.full_name ?? '—'}
                        </p>
                        <p className="font-body text-[13px] text-[#9898B8]">
                          {inv.applications?.real_email ?? ''}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <InvoiceTypeBadge type={inv.type} />
                      </td>
                      <td className="px-4 py-4">
                        {inv.discount_ghs > 0 ? (
                          <div>
                            <p className="font-body text-xs text-[#9898B8] line-through">
                              {formatAmountGhs(inv.amount_ghs)}
                            </p>
                            <p className="font-body text-sm font-semibold text-[#1A1A2E]">
                              {formatAmountGhs(inv.total_ghs)}
                            </p>
                          </div>
                        ) : (
                          <p className="font-body text-sm font-semibold text-[#1A1A2E]">
                            {formatAmountGhs(inv.total_ghs)}
                          </p>
                        )}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-4 font-body text-[13px]',
                          overdue ? 'text-[#E84A4A]' : 'text-[#9898B8]',
                        )}
                      >
                        {inv.due_date ? formatPaymentDate(inv.due_date) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-4 min-w-[140px]">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFEFF5]">
                          <div
                            className="h-full rounded-full bg-[#2DBFB8]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-1 font-body text-xs text-[#5A5A7A]">
                          {formatAmountGhs(paid)} / {formatAmountGhs(inv.total_ghs)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/payments/${inv.id}`}
                          className="font-body text-sm font-semibold text-[#5A5A7A] hover:text-[#1A1A2E]"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
