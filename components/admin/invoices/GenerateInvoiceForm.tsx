'use client'

import { useMemo, useState, useTransition } from 'react'
import Button from '@/components/ui/Button'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { generateTuitionInvoice } from '@/actions/invoice'
import { calculatePromoDiscount, type PromoCodeOption } from '@/lib/promo/calculate'
import { defaultDueDate, formatPaymentDate } from '@/lib/payments/format'
import { formatGHS } from '@/lib/utils'

type InvoiceApplication = {
  id: string
  reference: string
  full_name: string
  real_email: string
  courses: { title: string; tuition_fee_ghs: number } | null
  intakes: { name: string; start_date: string } | null
}

interface GenerateInvoiceFormProps {
  application: InvoiceApplication
  promoCodes: PromoCodeOption[]
  settings: Record<string, string>
}

export default function GenerateInvoiceForm({
  application,
  promoCodes,
  settings,
}: GenerateInvoiceFormProps) {
  const tuitionDefault = Number(application.courses?.tuition_fee_ghs ?? 0)
  const [amountGhs, setAmountGhs] = useState(tuitionDefault)
  const [promoId, setPromoId] = useState('')
  const [dueDate, setDueDate] = useState(defaultDueDate(14))
  const [allowInstallments, setAllowInstallments] = useState(false)
  const [installmentCount, setInstallmentCount] = useState(2)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const selectedPromo = useMemo(
    () => promoCodes.find((p) => p.id === promoId) ?? null,
    [promoCodes, promoId],
  )

  const discountGhs = useMemo(
    () => calculatePromoDiscount(amountGhs, selectedPromo),
    [amountGhs, selectedPromo],
  )

  const totalGhs = Math.max(0, amountGhs - discountGhs)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await generateTuitionInvoice({
        applicationId: application.id,
        amountGhs,
        discountGhs,
        promoCodeId: promoId || undefined,
        dueDate,
        allowInstallments,
        installmentCount: allowInstallments ? installmentCount : undefined,
        notes: notes.trim() || undefined,
      })
      if (result && 'error' in result) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,60%)_minmax(0,40%)]">
      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-8 shadow-card">
        <h2 className="mb-6 font-body text-base font-semibold text-[#1A1A2E]">
          Invoice Details
        </h2>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="space-y-5">
          <div>
            <AdminLabel htmlFor="amountGhs">Tuition Amount (GHS)</AdminLabel>
            <input
              id="amountGhs"
              type="number"
              min={0}
              step="0.01"
              required
              value={amountGhs}
              onChange={(e) => setAmountGhs(Number(e.target.value))}
              className={adminFieldClassName}
            />
            <p className="mt-1 font-body text-xs text-[#9898B8]">
              Pre-filled from course fee. Edit to override.
            </p>
          </div>

          <div>
            <AdminLabel htmlFor="promoCode">Promo Code (optional)</AdminLabel>
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

          <div>
            <AdminLabel htmlFor="dueDate">Payment Due Date</AdminLabel>
            <input
              id="dueDate"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={adminFieldClassName}
            />
          </div>

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

          <div>
            <p className="mb-3 font-body text-sm font-semibold text-[#1A1A2E]">
              Payment Instructions
            </p>
            <p className="mb-3 font-body text-xs text-[#9898B8]">
              These details will appear on the invoice
            </p>
            <div className="space-y-3">
              {settings.momo_number_1 && (
                <div className="rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] p-3">
                  <p className="font-body text-xs font-semibold uppercase text-[#9898B8]">
                    MoMo
                  </p>
                  <p className="font-body text-sm text-[#1A1A2E]">{settings.momo_number_1}</p>
                  {settings.momo_name_1 && (
                    <p className="font-body text-xs text-[#5A5A7A]">{settings.momo_name_1}</p>
                  )}
                </div>
              )}
              {settings.bank_account_number && (
                <div className="rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] p-3">
                  <p className="font-body text-xs font-semibold uppercase text-[#9898B8]">
                    Bank
                  </p>
                  <p className="font-body text-sm text-[#1A1A2E]">
                    {settings.bank_name} · {settings.bank_account_number}
                  </p>
                  {settings.bank_account_name && (
                    <p className="font-body text-xs text-[#5A5A7A]">
                      {settings.bank_account_name}
                      {settings.bank_branch ? ` · ${settings.bank_branch}` : ''}
                    </p>
                  )}
                </div>
              )}
              {settings.bank_swift_code && (
                <div className="rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] p-3">
                  <p className="font-body text-xs font-semibold uppercase text-[#9898B8]">
                    International
                  </p>
                  <p className="font-body text-sm text-[#1A1A2E]">
                    SWIFT: {settings.bank_swift_code}
                  </p>
                  {settings.bank_iban && (
                    <p className="font-body text-xs text-[#5A5A7A]">IBAN: {settings.bank_iban}</p>
                  )}
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
              placeholder="Any additional notes for the student..."
              className={adminFieldClassName}
            />
          </div>
        </div>

        <Button type="submit" variant="primary" size="lg" className="mt-8 w-full" disabled={pending}>
          {pending ? 'Generating…' : 'Generate and Send Invoice'}
        </Button>
      </form>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
            Invoice Preview
          </h2>
          <div className="space-y-3 font-body text-sm text-[#5A5A7A]">
            <p>
              <span className="text-[#9898B8]">Student:</span>{' '}
              {application.full_name}
              <br />
              <span className="text-[#9898B8]">{application.real_email}</span>
            </p>
            <p>
              <span className="text-[#9898B8]">Course:</span>{' '}
              {application.courses?.title ?? '—'}
            </p>
            <p>
              <span className="text-[#9898B8]">Intake:</span>{' '}
              {application.intakes
                ? `${application.intakes.name} · ${formatPaymentDate(application.intakes.start_date)}`
                : '—'}
            </p>
            <p>
              <span className="text-[#9898B8]">Reference:</span>{' '}
              <span className="font-mono text-[#C74A86]">REVINV… (on submit)</span>
            </p>
          </div>

          <div className="mt-4 space-y-2 border-t border-[#EFEFF5] pt-4">
            <div className="flex justify-between font-body text-sm">
              <span>Tuition</span>
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
            <span className="text-[#9898B8]">Due date:</span> {formatPaymentDate(dueDate)}
          </p>

          <p className="mt-6 font-body text-[13px] text-[#9898B8]">
            Invoice PDF will be generated and emailed to the student automatically.
          </p>
        </div>
      </aside>
    </div>
  )
}
