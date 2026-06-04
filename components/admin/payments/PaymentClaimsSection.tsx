'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  confirmManualPaymentClaim,
  rejectManualPaymentClaim,
} from '@/actions/manual-payment-claim'
import { formatAmountGhs, formatPaymentDate } from '@/lib/payments/format'
import { cn } from '@/lib/utils'

export type ManualPaymentClaimRow = {
  id: string
  transaction_ref: string
  created_at: string
  invoice: {
    id: string
    reference: string
    total_ghs: number
  }
  student: {
    full_name: string
    reference: string
  }
}

interface PaymentClaimsSectionProps {
  claims: ManualPaymentClaimRow[]
}

export default function PaymentClaimsSection({ claims }: PaymentClaimsSectionProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (claims.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#EFEFF5] bg-white p-8 text-center shadow-card">
        <p className="font-body text-sm text-[#9898B8]">No pending payment claims.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#EFEFF5] bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-[#EFEFF5] bg-[#F7F8FC]">
              {[
                'Student',
                'Invoice',
                'Amount',
                'Transaction ref',
                'Submitted',
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
            {claims.map((claim) => (
              <tr key={claim.id} className="border-b border-[#EFEFF5] hover:bg-[#FAFAFA]">
                <td className="px-4 py-4">
                  <p className="font-body text-sm font-semibold text-[#1A1A2E]">
                    {claim.student.full_name}
                  </p>
                  <p className="font-body text-xs text-[#9898B8]">{claim.student.reference}</p>
                </td>
                <td className="px-4 py-4 font-mono text-[13px] text-[#C74A86]">
                  {claim.invoice.reference}
                </td>
                <td className="px-4 py-4 font-body text-sm font-semibold text-[#1A1A2E]">
                  {formatAmountGhs(claim.invoice.total_ghs)}
                </td>
                <td className="px-4 py-4 font-mono text-[13px] text-[#5A5A7A]">
                  {claim.transaction_ref}
                </td>
                <td className="px-4 py-4 font-body text-[13px] text-[#9898B8]">
                  {formatPaymentDate(claim.created_at)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await confirmManualPaymentClaim(claim.id)
                          if ('error' in result) {
                            alert(result.error)
                            return
                          }
                          router.refresh()
                        })
                      }
                      className={cn(
                        'rounded-full bg-[#1E9990] px-4 py-2 font-body text-xs font-semibold text-white disabled:opacity-50',
                      )}
                    >
                      Confirm payment
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await rejectManualPaymentClaim(claim.id)
                          if ('error' in result) {
                            alert(result.error)
                            return
                          }
                          router.refresh()
                        })
                      }
                      className="rounded-full border border-[#E84A4A] px-4 py-2 font-body text-xs font-semibold text-[#E84A4A] disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
