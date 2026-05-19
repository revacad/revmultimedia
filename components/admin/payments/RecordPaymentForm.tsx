'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { confirmPayment, waiveInvoice } from '@/actions/payment'
import { formatAmountGhs } from '@/lib/payments/format'
import type { InvoiceStatus } from '@/lib/payments/types'

interface RecordPaymentFormProps {
  invoiceId: string
  remainingGhs: number
  status: InvoiceStatus
}

export default function RecordPaymentForm({
  invoiceId,
  remainingGhs,
  status,
}: RecordPaymentFormProps) {
  const router = useRouter()
  const [amountGhs, setAmountGhs] = useState(remainingGhs > 0 ? remainingGhs : 0)
  const [paymentMethod, setPaymentMethod] = useState('momo')
  const [transactionRef, setTransactionRef] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const closed = status === 'paid' || status === 'waived'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await confirmPayment({
        invoiceId,
        amountGhs,
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
        paymentNote: paymentNote.trim() || undefined,
        paidAt: new Date(paidAt).toISOString(),
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      if (result.fullyPaid && result.studentId) {
        setSuccess(`Payment confirmed. Student ID: ${result.studentId}`)
      } else {
        setSuccess('Partial payment recorded.')
      }
      router.refresh()
    })
  }

  function handleWaive() {
    if (!window.confirm('Mark this invoice as waived? This cannot be undone.')) return
    setError(null)
    startTransition(async () => {
      const result = await waiveInvoice(invoiceId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  if (closed) {
    return (
      <p className="font-body text-sm text-[#9898B8]">
        This invoice is {status}. No further payments can be recorded.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-[#2DBFB8]/30 bg-[#EBF9F8] px-3 py-2 text-sm text-[#1E9990]">
          {success}
        </p>
      )}

      <div>
        <AdminLabel htmlFor="amountGhs">Amount (GHS)</AdminLabel>
        <div className="flex items-center gap-2">
          <span className="font-body text-sm text-[#9898B8]">GHS</span>
          <input
            id="amountGhs"
            type="number"
            min={0.01}
            step="0.01"
            required
            value={amountGhs}
            onChange={(e) => setAmountGhs(Number(e.target.value))}
            className={adminFieldClassName}
          />
        </div>
        <p className="mt-1 font-body text-xs text-[#9898B8]">
          Remaining: {formatAmountGhs(remainingGhs)}
        </p>
      </div>

      <div>
        <AdminLabel htmlFor="paymentMethod">Payment method</AdminLabel>
        <select
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className={adminFieldClassName}
        >
          <option value="momo">MoMo</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="international_wire">International wire</option>
          <option value="cash">Cash</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <AdminLabel htmlFor="transactionRef">Transaction reference</AdminLabel>
        <input
          id="transactionRef"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          placeholder="MoMo transaction ID or bank ref"
          className={adminFieldClassName}
        />
      </div>

      <div>
        <AdminLabel htmlFor="paymentNote">Payment note</AdminLabel>
        <textarea
          id="paymentNote"
          rows={2}
          value={paymentNote}
          onChange={(e) => setPaymentNote(e.target.value)}
          placeholder="Any notes about this payment..."
          className={adminFieldClassName}
        />
      </div>

      <div>
        <AdminLabel htmlFor="paidAt">Payment date</AdminLabel>
        <input
          id="paidAt"
          type="date"
          required
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
          className={adminFieldClassName}
        />
      </div>

      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? 'Confirming…' : 'Confirm Payment'}
      </Button>

      <button
        type="button"
        onClick={handleWaive}
        disabled={pending}
        className="w-full font-body text-sm font-semibold text-[#E84A4A] hover:underline disabled:opacity-50"
      >
        Mark as Waived
      </button>
    </form>
  )
}
