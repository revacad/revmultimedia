'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import Button from '@/components/ui/Button'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { createAndSendApplicationInvoice } from '@/actions/invoice'
import { calculatePromoDiscount, type PromoCodeOption } from '@/lib/promo/calculate'
import { defaultDueDate, formatPaymentDate } from '@/lib/payments/format'
import { PROTECTED_PAYMENT_TYPE_SLUGS } from '@/lib/payments/payment-types'
import { formatGHS } from '@/lib/utils'

export type CreateInvoiceApplication = {
  id: string
  reference: string
  full_name: string
  real_email: string
  courses: { title: string; tuition_fee_ghs: number } | null
  intakes: { name: string; start_date: string } | null
}

export type CreateInvoicePaymentType = {
  id: string
  slug: string
  label: string
  description: string | null
}

type ExistingInvoice = {
  id: string
  type: string
  status: string
  reference: string
  total_ghs: number
}

interface CreateInvoiceFormProps {
  application: CreateInvoiceApplication
  paymentTypes: CreateInvoicePaymentType[]
  initialPaymentTypeId: string
  existingByType: Record<string, ExistingInvoice | undefined>
  promoCodes: PromoCodeOption[]
  settings: Record<string, string>
}

export default function CreateInvoiceForm({
  application,
  paymentTypes,
  initialPaymentTypeId,
  existingByType,
  promoCodes,
  settings,
}: CreateInvoiceFormProps) {
  const tuitionDefault = Number(application.courses?.tuition_fee_ghs ?? 0)

  const [paymentTypeId, setPaymentTypeId] = useState(initialPaymentTypeId)
  const [amountGhs, setAmountGhs] = useState(tuitionDefault)
  const [promoId, setPromoId] = useState('')
  const [dueDate, setDueDate] = useState(defaultDueDate(14))
  const [allowInstallments, setAllowInstallments] = useState(false)
  const [installmentCount, setInstallmentCount] = useState(2)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const selectedType = useMemo(
    () => paymentTypes.find((pt) => pt.id === paymentTypeId) ?? paymentTypes[0],
    [paymentTypeId, paymentTypes],
  )

  const isTuition = selectedType?.slug === 'tuition'
  const isSingleType = PROTECTED_PAYMENT_TYPE_SLUGS.includes(
    selectedType?.slug as (typeof PROTECTED_PAYMENT_TYPE_SLUGS)[number],
  )
  const existingForType = selectedType ? existingByType[selectedType.slug] : undefined

  const selectedPromo = useMemo(
    () => promoCodes.find((p) => p.id === promoId) ?? null,
    [promoCodes, promoId],
  )

  const discountGhs = useMemo(
    () => (isTuition ? calculatePromoDiscount(amountGhs, selectedPromo) : 0),
    [amountGhs, selectedPromo, isTuition],
  )

  const totalGhs = Math.max(0, amountGhs - discountGhs)

  function handlePaymentTypeChange(nextId: string) {
    setPaymentTypeId(nextId)
    setError(null)
    setPromoId('')
    const next = paymentTypes.find((pt) => pt.id === nextId)
    if (next?.slug === 'tuition') {
      setAmountGhs(tuitionDefault)
      setAllowInstallments(false)
    } else {
      setAmountGhs(0)
      setAllowInstallments(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (existingForType && isSingleType) return
    setError(null)
    startTransition(async () => {
      const result = await createAndSendApplicationInvoice({
        applicationId: application.id,
        paymentTypeId,
        amountGhs,
        discountGhs,
        promoCodeId: isTuition && promoId ? promoId : undefined,
        dueDate,
        allowInstallments: isTuition && allowInstallments,
        installmentCount: isTuition && allowInstallments ? installmentCount : undefined,
        notes: notes.trim() || undefined,
      })
      if (result && 'error' in result) {
        setError(result.error)
      }
    })
  }

  const previewLineLabel = isTuition ? 'Tuition' : selectedType?.label ?? 'Amount'

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,60%)_minmax(0,40%)]">
      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-8 shadow-card">
        <h2 className="mb-6 font-body text-base font-semibold text-[#1A1A2E]">Invoice details</h2>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {existingForType && isSingleType && (
          <div className="mb-6 rounded-lg border border-[#F18F3B]/30 bg-[#FEF6EE] px-4 py-3">
            <p className="font-body text-sm text-[#5A5A7A]">
              A {selectedType?.label.toLowerCase()} invoice already exists for this application (
              <span className="font-mono text-[#C74A86]">{existingForType.reference}</span>
              ).
            </p>
            <Link
              href={`/admin/payments/${existingForType.id}`}
              className="mt-2 inline-block font-body text-sm font-semibold text-primary hover:underline"
            >
              View existing invoice
            </Link>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <AdminLabel htmlFor="paymentType">Payment for</AdminLabel>
            <select
              id="paymentType"
              required
              value={paymentTypeId}
              onChange={(e) => handlePaymentTypeChange(e.target.value)}
              className={adminFieldClassName}
            >
              {paymentTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.label}
                </option>
              ))}
            </select>
            {selectedType?.description && (
              <p className="mt-2 font-body text-xs leading-relaxed text-[#9898B8]">
                {selectedType.description}
              </p>
            )}
          </div>

          <div>
            <AdminLabel htmlFor="amountGhs">Amount (GHS)</AdminLabel>
            <input
              id="amountGhs"
              type="number"
              min={0.01}
              step="0.01"
              required
              value={amountGhs || ''}
              onChange={(e) => setAmountGhs(Number(e.target.value))}
              className={adminFieldClassName}
            />
            {isTuition && (
              <p className="mt-1 font-body text-xs text-[#9898B8]">
                Pre-filled from course fee. Edit to override.
              </p>
            )}
          </div>

          {isTuition && (
            <div>
              <AdminLabel htmlFor="promoCode">Promo code (optional)</AdminLabel>
              <select
                id="promoCode"
                value={promoId}
                onChange={(e) => setPromoId(e.target.value)}
                className={adminFieldClassName}
              >
                <option value="">No promo code</option>
                {promoCodes.map((promo) => (
                  <option key={promo.id} value={promo.id}>
                    {promo.code} (
                    {promo.discount_type === 'percentage'
                      ? `${promo.discount_value}%`
                      : `GHS ${promo.discount_value}`}
                    )
                  </option>
                ))}
              </select>
              {selectedPromo && discountGhs > 0 && (
                <p className="mt-2 font-body text-sm text-[#1E9990]">
                  Discount: {formatGHS(discountGhs)} — New total: {formatGHS(totalGhs)}
                </p>
              )}
            </div>
          )}

          <div>
            <AdminLabel htmlFor="dueDate">Payment due date</AdminLabel>
            <input
              id="dueDate"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={adminFieldClassName}
            />
          </div>

          {isTuition && (
            <div className="rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] p-4">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="font-body text-sm font-semibold text-[#1A1A2E]">
                    Allow installments?
                  </p>
                  <p className="font-body text-xs text-[#9898B8]">
                    Student can pay in multiple parts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowInstallments}
                  onChange={(e) => setAllowInstallments(e.target.checked)}
                  className="h-5 w-5 rounded border-[#D8D8E8] text-primary"
                />
              </label>
              {allowInstallments && (
                <div className="mt-4">
                  <AdminLabel htmlFor="installmentCount">Number of installments</AdminLabel>
                  <select
                    id="installmentCount"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(Number(e.target.value))}
                    className={adminFieldClassName}
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="mb-3 font-body text-sm font-semibold text-[#1A1A2E]">
              Payment instructions
            </p>
            <p className="mb-3 font-body text-xs text-[#9898B8]">
              Included in the email to the student
            </p>
            <div className="space-y-3">
              {settings.momo_number_1 && (
                <div className="rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] p-3">
                  <p className="font-body text-xs font-semibold uppercase text-[#9898B8]">MoMo</p>
                  <p className="font-body text-sm text-[#1A1A2E]">{settings.momo_number_1}</p>
                </div>
              )}
              {settings.bank_account_number && (
                <div className="rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] p-3">
                  <p className="font-body text-xs font-semibold uppercase text-[#9898B8]">Bank</p>
                  <p className="font-body text-sm text-[#1A1A2E]">
                    {settings.bank_name} · {settings.bank_account_number}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <AdminLabel htmlFor="notes">Invoice notes</AdminLabel>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. MacBook Pro 14&quot; — serial to be assigned on payment"
              className={adminFieldClassName}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-8 w-full"
          disabled={pending || Boolean(existingForType && isSingleType)}
        >
          {pending ? 'Creating…' : 'Create and send invoice'}
        </Button>
      </form>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Preview</h2>
          <div className="space-y-3 font-body text-sm text-[#5A5A7A]">
            <p>
              <span className="text-[#9898B8]">Student:</span> {application.full_name}
              <br />
              <span className="text-[#9898B8]">{application.real_email}</span>
            </p>
            <p>
              <span className="text-[#9898B8]">Payment for:</span>{' '}
              <span className="font-semibold text-[#1A1A2E]">{selectedType?.label}</span>
            </p>
            {application.courses && (
              <p>
                <span className="text-[#9898B8]">Course:</span> {application.courses.title}
              </p>
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-[#EFEFF5] pt-4">
            <div className="flex justify-between font-body text-sm">
              <span>{previewLineLabel}</span>
              <span>{formatGHS(amountGhs)}</span>
            </div>
            {discountGhs > 0 && (
              <div className="flex justify-between font-body text-sm text-[#1E9990]">
                <span>Discount</span>
                <span>- {formatGHS(discountGhs)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#EFEFF5] pt-3">
              <span className="font-body text-sm font-semibold">Total</span>
              <span className="font-display text-2xl font-semibold text-[#C74A86]">
                {formatGHS(totalGhs)}
              </span>
            </div>
          </div>

          <p className="mt-4 font-body text-sm text-[#5A5A7A]">
            <span className="text-[#9898B8]">Due:</span> {formatPaymentDate(dueDate)}
          </p>

          <p className="mt-6 font-body text-[13px] text-[#9898B8]">
            Email and SMS are sent automatically. The student can also view the invoice in their
            portal once enrolled.
          </p>
        </div>
      </aside>
    </div>
  )
}
