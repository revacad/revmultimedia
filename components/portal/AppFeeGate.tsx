'use client'

import PaymentInstructions from '@/components/portal/PaymentInstructions'
import { PaystackButton } from '@/components/portal/PaystackButton'

interface AppFeeGateProps {
  appFeePaid: boolean
  invoiceRef?: string
  appFeeAmount?: number
  applicationRef?: string
  payerEmail?: string
  hidePayButton?: boolean
  settings?: Record<string, string>
  children?: React.ReactNode
}

export function AppFeeGate({
  appFeePaid,
  invoiceRef,
  appFeeAmount,
  applicationRef,
  payerEmail,
  hidePayButton = false,
  settings = {},
  children,
}: AppFeeGateProps) {
  if (appFeePaid) return <>{children}</>

  const amountGhs = appFeeAmount ?? 100
  const paymentReference = invoiceRef ?? applicationRef ?? ''

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

      {invoiceRef && (
        <div className="mt-5 rounded-[10px] border border-[#EFEFF5] bg-[#F7F8FC] px-5 py-3 font-mono text-sm text-[#C74A86]">
          {invoiceRef}
        </div>
      )}

      <div className="relative mt-5 w-full max-w-[420px] rounded-xl border-[1.5px] border-[#2DBFB8]/30 bg-[#EBF9F8] p-5 text-left">
        <p className="font-body text-[15px] font-semibold text-[#1A1A2E]">
          You will be redirected to Paystack
        </p>
        <p className="mt-2 font-body text-sm leading-relaxed text-[#5A5A7A]">
          Click the button below to pay your GHS {amountGhs} application fee securely. We will
          confirm your payment and unlock your portal right away.
        </p>
      </div>

      {!hidePayButton && invoiceRef && applicationRef && payerEmail && (
        <div className="mt-6 w-full max-w-[420px]">
          <PaystackButton
            applicationRef={applicationRef}
            invoiceRef={invoiceRef}
            amount={Math.round(amountGhs * 100)}
            email={payerEmail}
          />
        </div>
      )}

      <details className="group mt-6 w-full max-w-[420px] text-left">
        <summary className="cursor-pointer list-none font-body text-sm font-semibold text-[#5A5A7A] marker:content-none hover:text-[#C74A86] [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            Or pay manually
            <svg
              className="h-4 w-4 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </summary>
        <PaymentInstructions settings={settings} invoiceReference={paymentReference} />
      </details>
    </div>
  )
}
