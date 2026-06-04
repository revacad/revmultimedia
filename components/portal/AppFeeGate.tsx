'use client'

import PaymentInstructions from '@/components/portal/PaymentInstructions'
import ManualPaymentClaimForm from '@/components/portal/ManualPaymentClaimForm'
import ManualPaymentOffPortalHelp from '@/components/portal/ManualPaymentOffPortalHelp'
import { PaystackButton } from '@/components/portal/PaystackButton'
import { formatGHS } from '@/lib/utils'

interface AppFeeGateProps {
  appFeePaid: boolean
  invoiceId?: string
  invoiceRef?: string
  appFeeAmount?: number
  applicationRef?: string
  payerEmail?: string
  paystackEnabled?: boolean
  settings?: Record<string, string>
  children?: React.ReactNode
}

export function AppFeeGate({
  appFeePaid,
  invoiceId,
  invoiceRef,
  appFeeAmount,
  applicationRef,
  payerEmail,
  paystackEnabled = true,
  settings = {},
  children,
}: AppFeeGateProps) {
  if (appFeePaid) return <>{children}</>

  const amountGhs = appFeeAmount ?? 100
  const paymentReference = invoiceRef ?? applicationRef ?? ''
  const feeLabel = formatGHS(amountGhs)
  const canPaystack =
    paystackEnabled &&
    Boolean(invoiceRef) &&
    Boolean(applicationRef) &&
    Boolean(payerEmail)

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl bg-white p-8 text-center shadow-card">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#C74A86]/20 bg-[#FDF0F6]">
        <svg
          className="h-6 w-6 text-[#C74A86]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>

      <h3 className="font-display text-xl font-semibold text-[#1A1A2E]">Application fee required</h3>
      <p className="mt-2 max-w-[420px] font-body text-[15px] leading-relaxed text-[#5A5A7A]">
        Pay your application fee to unlock your full portal — invoices, documents, and payment
        tracking.
      </p>

      <p className="mt-4 font-display text-2xl font-semibold text-[#C74A86] md:text-3xl">{feeLabel}</p>

      {invoiceRef && (
        <div className="mt-5 rounded-[10px] border border-[#EFEFF5] bg-[#F7F8FC] px-5 py-3 font-mono text-sm text-[#C74A86]">
          {invoiceRef}
        </div>
      )}

      {paystackEnabled ? (
        <div className="mt-6 w-full max-w-[420px]">
          <div className="rounded-xl border-[1.5px] border-[#2DBFB8]/30 bg-[#EBF9F8] p-5 text-left">
            <p className="font-body text-[15px] font-semibold text-[#1A1A2E]">Pay with Paystack</p>
            <p className="mt-2 font-body text-sm leading-relaxed text-[#5A5A7A]">
              Pay your {feeLabel} application fee securely online. We will confirm your payment and
              unlock your portal right away.
            </p>
            {canPaystack ? (
              <div className="mt-4 flex justify-center">
                <PaystackButton
                  applicationRef={applicationRef!}
                  invoiceRef={invoiceRef!}
                  amount={Math.round(amountGhs * 100)}
                  email={payerEmail!}
                  buttonLabel={`Pay with Paystack · ${feeLabel}`}
                />
              </div>
            ) : (
              <p className="mt-3 font-body text-sm text-[#E84A4A]">
                Online payment is temporarily unavailable. Please refresh the page or contact
                accounts below.
              </p>
            )}
          </div>
          <ManualPaymentOffPortalHelp settings={settings} />
        </div>
      ) : (
        <div className="mt-6 w-full max-w-[420px] text-left">
          <PaymentInstructions settings={settings} invoiceReference={paymentReference} />
          {invoiceId ? <ManualPaymentClaimForm invoiceId={invoiceId} /> : null}
        </div>
      )}
    </div>
  )
}
