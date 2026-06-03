'use client'

import { useState } from 'react'
import { getPortalInvoicePdfUrl, getPortalReceiptPdfUrl } from '@/actions/portal-invoices'
import type { PortalReceiptLink } from '@/lib/portal/invoice-receipts'
import { formatApplicationDate } from '@/lib/applications/format'
import { formatGHS } from '@/lib/utils'
import type { InvoiceStatus } from '@/lib/payments/types'

interface PortalInvoiceDocumentsProps {
  invoiceId: string
  status: InvoiceStatus
  receipts: PortalReceiptLink[]
}

function PortalInvoicePdfButton({
  label,
  fetchUrl,
}: {
  label: string
  fetchUrl: () => Promise<{ url: string } | { error: string }>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          setError(null)
          const result = await fetchUrl()
          if ('url' in result) {
            window.open(result.url, '_blank', 'noopener,noreferrer')
          } else {
            setError(result.error)
          }
          setLoading(false)
        }}
        className="inline-flex rounded-full border border-[#D8D8E8] px-4 py-2 font-body text-sm font-semibold text-[#5A5A7A] hover:border-[#C74A86] hover:text-[#C74A86] disabled:opacity-60"
      >
        {loading ? 'Opening…' : label}
      </button>
      {error && (
        <span className="font-body text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </span>
  )
}

export default function PortalInvoiceDocuments({
  invoiceId,
  status,
  receipts,
}: PortalInvoiceDocumentsProps) {
  const showReceipts =
    (status === 'paid' || status === 'partially_paid') && receipts.length > 0

  return (
    <div className="mt-5 border-t border-[#EFEFF5] pt-4">
      <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
        Documents
      </p>
      <div className="flex flex-wrap gap-2">
        <PortalInvoicePdfButton
          label="Download invoice (PDF)"
          fetchUrl={() => getPortalInvoicePdfUrl(invoiceId)}
        />
        {showReceipts &&
          receipts.map((receipt) => (
            <PortalInvoicePdfButton
              key={receipt.installmentId ?? 'paystack'}
              label={receipt.label}
              fetchUrl={() =>
                getPortalReceiptPdfUrl(
                  invoiceId,
                  receipt.installmentId ?? undefined,
                )
              }
            />
          ))}
      </div>
      {showReceipts && (
        <ul className="mt-3 space-y-1">
          {receipts.map((receipt) => (
            <li key={receipt.installmentId ?? 'paystack'} className="font-body text-xs text-[#9898B8]">
              {receipt.label} · {formatGHS(receipt.amountGhs)} ·{' '}
              {formatApplicationDate(receipt.paidAt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
