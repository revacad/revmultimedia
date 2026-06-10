'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import WaiverModal from '@/components/admin/payments/WaiverModal'
import { confirmPayment } from '@/actions/payment'
import { formatAmountGhs } from '@/lib/payments/format'
import { paymentTypeLabelFromSlug } from '@/lib/payments/payment-types'
import type { InvoiceStatus } from '@/lib/payments/types'

interface RecordPaymentFormProps {
  invoiceId: string
  totalGhs: number
  paidGhs: number
  remainingGhs: number
  status: InvoiceStatus
  paymentForLabel: string
  invoiceType: string
  studentName: string
  applicationReference: string
  invoiceReference: string
}

export default function RecordPaymentForm({
  invoiceId,
  totalGhs,
  paidGhs,
  remainingGhs,
  status,
  paymentForLabel,
  invoiceType,
  studentName,
  applicationReference,
  invoiceReference,
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
  const [cooldown, setCooldown] = useState(0)
  const [waiverOpen, setWaiverOpen] = useState(false)

  const closed =
    status === 'paid' || status === 'waived' || remainingGhs <= 0

  const startCooldown = () => {
    setCooldown(8)
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function resetFormFields() {
    setAmountGhs(remainingGhs > 0 ? remainingGhs : 0)
    setPaymentMethod('momo')
    setTransactionRef('')
    setPaymentNote('')
    setPaidAt(new Date().toISOString().slice(0, 10))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (amountGhs > remainingGhs) {
      setError(`Amount cannot exceed remaining balance of ${formatAmountGhs(remainingGhs)}.`)
      return
    }
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
        setSuccess(
          `Partial payment recorded. Balance ${formatAmountGhs(Math.max(0, remainingGhs - amountGhs))} remaining.`,
        )
      }
      resetFormFields()
      startCooldown()
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

  const manualPaymentNote =
    'Record MoMo, bank transfer, cash, or other manual payments here.'

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] px-4 py-3">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
            Payment for
          </p>
          <p className="mt-1 font-body text-base font-semibold text-[#1A1A2E]">
            {paymentForLabel || paymentTypeLabelFromSlug(invoiceType)}
          </p>
          <p className="mt-1 font-body text-sm text-[#5A5A7A]">
            {studentName} · <span className="font-mono text-[#C74A86]">{applicationReference}</span>
          </p>
          <p className="mt-2 font-body text-xs leading-relaxed text-[#9898B8]">
            {manualPaymentNote}
          </p>
          {(status === 'partially_paid' || paidGhs > 0) && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-[#EFEFF5] pt-3">
              <span className="inline-flex rounded-full bg-[#EBF9F8] px-2.5 py-0.5 font-body text-xs font-semibold text-[#1E9990]">
                Paid {formatAmountGhs(paidGhs)}
              </span>
              <span className="inline-flex rounded-full bg-[#FDECEC] px-2.5 py-0.5 font-body text-xs font-semibold text-[#E84A4A]">
                Balance {formatAmountGhs(remainingGhs)}
              </span>
              <span className="font-body text-xs text-[#9898B8]">
                Total {formatAmountGhs(totalGhs)}
              </span>
            </div>
          )}
        </div>

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
              max={remainingGhs > 0 ? remainingGhs : undefined}
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
            maxLength={100}
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
            maxLength={500}
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

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={pending || cooldown > 0}
        >
          {pending
            ? 'Confirming…'
            : cooldown > 0
              ? `Next payment in ${cooldown}s`
              : 'Confirm Payment'}
        </Button>

        <button
          type="button"
          onClick={() => setWaiverOpen(true)}
          disabled={pending || cooldown > 0}
          className="w-full font-body text-sm font-semibold text-[#E84A4A] hover:underline disabled:opacity-50"
        >
          Mark as Waived
        </button>
      </form>

      {waiverOpen && (
        <WaiverModal
          invoiceId={invoiceId}
          invoiceRef={invoiceReference}
          studentName={studentName}
          remainingGhs={remainingGhs}
          onClose={() => setWaiverOpen(false)}
        />
      )}
    </>
  )
}
