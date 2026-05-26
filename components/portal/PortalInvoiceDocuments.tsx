'use client'

import { getPortalInvoicePdfUrl, getPortalReceiptPdfUrl } from '@/actions/portal-invoices'
import type { PortalReceiptLink } from '@/lib/portal/invoice-receipts'
import PortalPdfDownloadButton from '@/components/portal/PortalPdfDownloadButton'
import { formatApplicationDate } from '@/lib/applications/format'
import { formatGHS } from '@/lib/utils'
import type { InvoiceStatus } from '@/lib/payments/types'

interface PortalInvoiceDocumentsProps {
  invoiceId: string
  status: InvoiceStatus
  receipts: PortalReceiptLink[]
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
        <PortalPdfDownloadButton
          label="Download invoice (PDF)"
          onFetchUrl={() => getPortalInvoicePdfUrl(invoiceId)}
        />
        {showReceipts &&
          receipts.map((receipt) => (
            <PortalPdfDownloadButton
              key={receipt.installmentId ?? 'paystack'}
              label={receipt.label}
              onFetchUrl={() =>
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
