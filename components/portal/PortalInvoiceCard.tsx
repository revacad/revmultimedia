'use client'

import { useState } from 'react'
import CopyableReference from '@/components/ui/CopyableReference'
import OverdueInvoiceBanner from '@/components/admin/OverdueInvoiceBanner'
import InvoiceStatusBadge from '@/components/admin/payments/InvoiceStatusBadge'
import { isOverdue } from '@/lib/payments/format'
import { PaystackButton } from '@/components/portal/PaystackButton'
import PortalInvoicePaymentCard from '@/components/portal/PortalInvoicePaymentCard'
import { formatApplicationDate } from '@/lib/applications/format'
import PortalInvoiceDocuments from '@/components/portal/PortalInvoiceDocuments'
import type { PortalReceiptLink } from '@/lib/portal/invoice-receipts'
import type { PortalInvoiceRow } from '@/lib/portal/invoices'
import { formatInvoiceType } from '@/lib/payments/format-invoice-type'
import type { InvoiceStatus } from '@/lib/payments/types'
import { formatGHS } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PortalInvoiceCardProps {
  invoice: PortalInvoiceRow
  receipts: PortalReceiptLink[]
  settings: Record<string, string>
  showInternational: boolean
  payerEmail: string
}

export default function PortalInvoiceCard({
  invoice,
  receipts,
  settings,
  showInternational,
  payerEmail,
}: PortalInvoiceCardProps) {
  const typeLabel = formatInvoiceType(
    invoice.type,
    invoice.payment_types?.label ?? undefined,
  )
  const paidAmount = invoice.installments.reduce((sum, row) => sum + Number(row.amount_ghs), 0)
  const total = invoice.total_ghs
  const progress = total > 0 ? Math.min(100, (paidAmount / total) * 100) : 0
  const status = invoice.status as InvoiceStatus
  const overdue = isOverdue(invoice.due_date, status)
  const lastPaid = invoice.installments
    .map((i) => i.paid_at)
    .filter(Boolean)
    .sort()
    .pop()

  const isAppFee = invoice.type === 'application_fee'
  const [expanded, setExpanded] = useState(isAppFee && status === 'paid')

  const allowPaystack = Boolean(invoice.payment_types?.allow_paystack)
  const showBankInstructions = status === 'unpaid' || status === 'partially_paid'
  const isTuition = invoice.type === 'tuition'
  const remainingGhs = Math.max(0, total - paidAmount)
  const paystackAmountPesewas = Math.round(remainingGhs * 100)

  return (
    <article className="mb-4 rounded-xl bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CopyableReference reference={invoice.reference} />
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#F0F0F8] px-3 py-1 font-body text-xs font-semibold text-[#5A5A7A]">
              {typeLabel}
            </span>
            <InvoiceStatusBadge status={status} dueDate={invoice.due_date} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="font-display text-2xl font-semibold text-[#1A1A2E]">{formatGHS(total)}</p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#9898B8] transition-colors hover:bg-[#F7F8FC] hover:text-[#1A1A2E]"
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse invoice details' : 'Expand invoice details'}
          >
            <svg
              className={cn('h-5 w-5 transition-transform duration-300', expanded && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {overdue ? (
        <div className="mt-4">
          <OverdueInvoiceBanner />
        </div>
      ) : null}

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-4">
            {invoice.due_date && (
              <p className="font-body text-sm text-[#9898B8]">
                Due {formatApplicationDate(invoice.due_date)}
              </p>
            )}

            {status === 'partially_paid' && (
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-[#EFEFF5]">
                  <div
                    className="h-full rounded-full bg-[#C74A86]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 font-body text-xs text-[#9898B8]">
                  {formatGHS(paidAmount)} of {formatGHS(total)} paid
                </p>
              </div>
            )}

            {showBankInstructions && isTuition && (
              <div className="mt-4">
                <PortalInvoicePaymentCard
                  settings={settings}
                  invoiceReference={invoice.reference}
                  showInternational={showInternational}
                />
              </div>
            )}

            {showBankInstructions && !isTuition && !allowPaystack && (
              <div className="mt-4">
                <PortalInvoicePaymentCard
                  settings={settings}
                  invoiceReference={invoice.reference}
                  showInternational={showInternational}
                />
              </div>
            )}

            {showBankInstructions && allowPaystack && remainingGhs > 0 && (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] p-4">
                  <p className="font-body text-sm font-semibold text-[#1A1A2E]">Pay online</p>
                  <p className="mt-1 font-body text-xs text-[#9898B8]">
                    Card or mobile money - {formatGHS(remainingGhs)}
                  </p>
                  <div className="mt-3">
                    <PaystackButton
                      applicationRef={invoice.applications?.reference ?? invoice.reference}
                      invoiceRef={invoice.reference}
                      amount={paystackAmountPesewas}
                      email={payerEmail}
                    />
                  </div>
                </div>
                <p className="font-body text-xs text-[#9898B8]">Or pay manually:</p>
                <PortalInvoicePaymentCard
                  settings={settings}
                  invoiceReference={invoice.reference}
                  showInternational={showInternational}
                />
              </div>
            )}

            {status === 'paid' && (
              <p className="mt-4 flex items-center gap-2 font-body text-sm font-semibold text-[#1E9990]">
                <span aria-hidden>✓</span> Payment confirmed
                {lastPaid && (
                  <span className="font-normal text-[#9898B8]">
                    · {formatApplicationDate(lastPaid)}
                  </span>
                )}
              </p>
            )}

            <PortalInvoiceDocuments
              invoiceId={invoice.id}
              status={status}
              receipts={receipts}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
