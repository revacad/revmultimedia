'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { applyInvoiceWaiver } from '@/actions/payment'
import { formatAmountGhs } from '@/lib/payments/format'
import { WAIVER_REASONS, type WaiverReason } from '@/lib/payments/waiver'

interface WaiverModalProps {
  invoiceId: string
  invoiceRef: string
  studentName: string
  remainingGhs: number
  onClose: () => void
}

type WaiverStep = 1 | 2 | 3

export default function WaiverModal({
  invoiceId,
  invoiceRef,
  studentName,
  remainingGhs,
  onClose,
}: WaiverModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<WaiverStep>(1)
  const [amountMode, setAmountMode] = useState<'full' | 'custom'>('full')
  const [customAmount, setCustomAmount] = useState(remainingGhs > 0 ? remainingGhs : 0)
  const [reason, setReason] = useState<WaiverReason>(WAIVER_REASONS[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const waiverAmount = amountMode === 'full' ? remainingGhs : customAmount

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, pending])

  function validateAmountStep(): string | null {
    if (remainingGhs <= 0) return 'Nothing left to waive on this invoice.'
    if (waiverAmount < 1) return 'Waiver amount must be at least GHS 1.'
    if (waiverAmount > remainingGhs) {
      return `Custom amount cannot exceed remaining balance of ${formatAmountGhs(remainingGhs)}.`
    }
    return null
  }

  function validateReasonStep(): string | null {
    if (note.trim().length < 10) {
      return 'Internal note must be at least 10 characters.'
    }
    return null
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await applyInvoiceWaiver({
        invoiceId,
        waiverAmount,
        reason,
        note: note.trim(),
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/40 p-4"
      role="presentation"
      onClick={pending ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waiver-modal-title"
        className="w-full max-w-lg rounded-xl border border-[#EFEFF5] bg-white p-5 shadow-card sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="waiver-modal-title"
          className="font-display text-xl font-semibold text-[#1A1A2E]"
        >
          Apply fee waiver
        </h2>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          Step {step} of 3 · {invoiceRef} · {studentName}
        </p>

        {step === 1 && (
          <div className="mt-5 space-y-4">
            <fieldset className="space-y-3">
              <legend className="sr-only">Waiver amount</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#EFEFF5] p-4">
                <input
                  type="radio"
                  name="waiver-amount"
                  checked={amountMode === 'full'}
                  onChange={() => setAmountMode('full')}
                  className="mt-1"
                />
                <span className="font-body text-sm text-[#1A1A2E]">
                  Full remaining balance ({formatAmountGhs(remainingGhs)})
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#EFEFF5] p-4">
                <input
                  type="radio"
                  name="waiver-amount"
                  checked={amountMode === 'custom'}
                  onChange={() => setAmountMode('custom')}
                  className="mt-1"
                />
                <span className="w-full font-body text-sm text-[#1A1A2E]">
                  Custom amount
                  {amountMode === 'custom' && (
                    <input
                      type="number"
                      min={1}
                      max={remainingGhs}
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      className={`${adminFieldClassName} mt-2`}
                    />
                  )}
                </span>
              </label>
            </fieldset>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  const validationError = validateAmountStep()
                  if (validationError) {
                    setError(validationError)
                    return
                  }
                  setError(null)
                  setStep(2)
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-4">
            <div>
              <AdminLabel htmlFor="waiver-reason">Reason for waiver</AdminLabel>
              <select
                id="waiver-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as WaiverReason)}
                className={adminFieldClassName}
                required
              >
                {WAIVER_REASONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <AdminLabel htmlFor="waiver-note">Internal note</AdminLabel>
              <textarea
                id="waiver-note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Provide a brief note about this waiver. This is for internal records only."
                className={adminFieldClassName}
                required
                minLength={10}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  const validationError = validateReasonStep()
                  if (validationError) {
                    setError(validationError)
                    return
                  }
                  setError(null)
                  setStep(3)
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] p-4 font-body text-sm text-[#1A1A2E]">
              <p>
                You are about to waive {formatAmountGhs(waiverAmount)} from invoice{' '}
                <span className="font-mono text-[#C74A86]">{invoiceRef}</span> for{' '}
                {studentName}.
              </p>
              <p className="mt-3">
                <span className="font-semibold">Reason:</span> {reason}
              </p>
              <p className="mt-2 whitespace-pre-wrap">
                <span className="font-semibold">Note:</span> {note.trim()}
              </p>
            </div>
            <p className="font-body text-sm font-semibold text-[#E84A4A]">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(2)} disabled={pending}>
                Back
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={handleConfirm}
              >
                {pending ? 'Applying…' : 'Confirm Waiver'}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
