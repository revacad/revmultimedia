'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitManualPaymentClaim } from '@/actions/manual-payment-claim'

interface ManualPaymentClaimFormProps {
  invoiceId: string
}

export default function ManualPaymentClaimForm({ invoiceId }: ManualPaymentClaimFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [transactionRef, setTransactionRef] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (success) {
    return (
      <div className="mt-4 rounded-lg border border-[#2DBFB8]/30 bg-[#EBF9F8] p-4 text-left">
        <p className="font-body text-sm font-semibold text-[#1E9990]">{success}</p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-full bg-[#C74A86] px-5 py-3 font-body text-sm font-semibold text-white"
      >
        I have made payment
      </button>
    )
  }

  return (
    <form
      className="mt-4 rounded-lg border border-[#EFEFF5] bg-white p-4 text-left"
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        startTransition(async () => {
          const result = await submitManualPaymentClaim(invoiceId, transactionRef)
          if ('error' in result) {
            setError(result.error)
            return
          }
          setSuccess(result.message)
          router.refresh()
        })
      }}
    >
      <label htmlFor="transaction-ref" className="font-body text-sm font-semibold text-[#1A1A2E]">
        MoMo reference or transaction description
      </label>
      <input
        id="transaction-ref"
        value={transactionRef}
        onChange={(e) => setTransactionRef(e.target.value)}
        required
        placeholder="e.g. 0241234567 or bank transfer ref"
        className="mt-2 w-full rounded-[10px] border border-[#D8D8E8] px-3 py-2.5 font-body text-sm text-[#1A1A2E] outline-none focus:border-[#C74A86]"
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || !transactionRef.trim()}
          className="rounded-full bg-[#C74A86] px-5 py-2.5 font-body text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? 'Submitting…' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          className="rounded-full border border-[#D8D8E8] px-5 py-2.5 font-body text-sm font-semibold text-[#5A5A7A]"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p className="mt-3 font-body text-sm text-[#E84A4A]" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
