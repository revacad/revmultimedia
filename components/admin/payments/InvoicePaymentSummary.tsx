import { formatAmountGhs } from '@/lib/payments/format'
import { getInvoicePaidAndRemaining } from '@/lib/payments/invoice-stats'
import InvoiceStatusBadge from '@/components/admin/payments/InvoiceStatusBadge'
import PaymentMethodBadge from '@/components/admin/payments/PaymentMethodBadge'
import type { InvoiceStatus } from '@/lib/payments/types'
import { cn } from '@/lib/utils'

type InvoicePaymentSummaryProps = {
  totalGhs: number
  status: string
  paymentMethod?: string | null
  paystackReference?: string | null
  installments?: { amount_ghs: number | string }[]
  compact?: boolean
}

export default function InvoicePaymentSummary({
  totalGhs,
  status,
  paymentMethod,
  paystackReference,
  installments = [],
  compact = false,
}: InvoicePaymentSummaryProps) {
  const { paid, remaining, overpaid } = getInvoicePaidAndRemaining({
    status,
    total_ghs: totalGhs,
    payment_method: paymentMethod ?? null,
    paystack_reference: paystackReference ?? null,
    installments,
  })

  const invoiceStatus = status as InvoiceStatus
  const showBreakdown =
    status === 'partially_paid' ||
    status === 'unpaid' ||
    paid > 0 ||
    overpaid > 0

  return (
    <div className={cn(compact ? 'space-y-1' : 'space-y-2')}>
      <p className="font-body text-sm text-[#1A1A2E]">
        {formatAmountGhs(totalGhs)}
        {!showBreakdown && (
          <span className="ml-2 inline-flex flex-wrap items-center gap-2">
            <InvoiceStatusBadge status={invoiceStatus} />
            {paymentMethod ? <PaymentMethodBadge method={paymentMethod} /> : null}
          </span>
        )}
      </p>
      {showBreakdown && (
        <div className="flex flex-wrap items-center gap-2">
          <InvoiceStatusBadge status={invoiceStatus} />
          {paymentMethod ? <PaymentMethodBadge method={paymentMethod} /> : null}
          {paid > 0 && (
            <span className="inline-flex rounded-full bg-[#EBF9F8] px-2.5 py-0.5 font-body text-xs font-semibold text-[#1E9990]">
              Paid {formatAmountGhs(paid)}
            </span>
          )}
          {remaining > 0 && (
            <span className="inline-flex rounded-full bg-[#FDECEC] px-2.5 py-0.5 font-body text-xs font-semibold text-[#E84A4A]">
              Balance {formatAmountGhs(remaining)}
            </span>
          )}
          {status === 'paid' && remaining <= 0 && paid > 0 && (
            <span className="inline-flex rounded-full bg-[#EBF9F8] px-2.5 py-0.5 font-body text-xs font-semibold text-[#1E9990]">
              Paid in full
            </span>
          )}
          {overpaid > 0 && (
            <span className="inline-flex rounded-full bg-[#FEF6EE] px-2.5 py-0.5 font-body text-xs font-semibold text-[#C4701E]">
              Overpaid {formatAmountGhs(overpaid)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
