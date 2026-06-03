'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import InvoiceStatusBadge from '@/components/admin/payments/InvoiceStatusBadge'
import InvoiceTypeBadge from '@/components/admin/payments/InvoiceTypeBadge'
import {
  formatAmountGhs,
  formatPaymentDate,
  isOverdue,
} from '@/lib/payments/format'
import {
  aggregatePaymentStats,
  getInvoicePaidAndRemaining,
} from '@/lib/payments/invoice-stats'
import type { InvoiceStatus, InvoiceType, PaymentListRow } from '@/lib/payments/types'
import { StateWrapper } from '@/components/ui/StateWrapper'
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
  fetchError?: string | null
}

export default function PaymentsPageClient({
  invoices,
  fetchError = null,
}: PaymentsPageClientProps) {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'all'>('all')

  const stats = useMemo(() => aggregatePaymentStats(invoices), [invoices])

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
          { label: 'Total collected (GHS)', value: formatAmountGhs(stats.totalCollected) },
          { label: 'Outstanding', value: formatAmountGhs(stats.outstanding) },
          { label: 'Collected this month', value: formatAmountGhs(stats.paidThisMonth) },
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

      <StateWrapper
        loading={false}
        error={fetchError}
        empty={!fetchError && filtered.length === 0}
        emptyTitle={invoices.length === 0 ? 'No invoices yet' : 'No matching invoices'}
        emptyMessage={
          invoices.length === 0
            ? 'Invoices created from applications will appear here.'
            : 'Try a different filter.'
        }
      >
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
                  const { paid, remaining, overpaid } = getInvoicePaidAndRemaining({
                    status: inv.status,
                    total_ghs: inv.total_ghs,
                    payment_method: inv.payment_method,
                    paystack_reference: inv.paystack_reference,
                    installments: inv.installments,
                  })
                  const progress =
                    inv.total_ghs > 0
                      ? Math.min(100, (paid / inv.total_ghs) * 100)
                      : 0
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
                        <InvoiceTypeBadge
                          type={inv.type}
                          label={inv.payment_type_label}
                        />
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
                        <InvoiceStatusBadge status={inv.status} dueDate={inv.due_date} />
                      </td>
                      <td className="px-4 py-4 min-w-[160px]">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFEFF5]">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              inv.status === 'paid' ? 'bg-[#1E9990]' : 'bg-[#2DBFB8]',
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-1 font-body text-xs">
                          <span className="font-semibold text-[#1E9990]">
                            {formatAmountGhs(paid)}
                          </span>
                          <span className="text-[#9898B8]">
                            {' '}
                            / {formatAmountGhs(inv.total_ghs)}
                          </span>
                        </p>
                        {remaining > 0 && (
                          <p className="font-body text-xs font-semibold text-[#E84A4A]">
                            Balance {formatAmountGhs(remaining)}
                          </p>
                        )}
                        {overpaid > 0 && (
                          <p className="font-body text-xs font-semibold text-[#C4701E]">
                            Overpaid {formatAmountGhs(overpaid)}
                          </p>
                        )}
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
      </StateWrapper>
    </div>
  )
}
