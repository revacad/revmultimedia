'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { createPromoCode, setPromoCodeActive } from '@/actions/promo'
import { formatPaymentDateTime } from '@/lib/payments/format'

export type PromoCodeRow = {
  id: string
  code: string
  discount_type: 'percentage' | 'flat_ghs'
  discount_value: number
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
  admins: { full_name: string } | null
}

interface PromoCodesPageClientProps {
  promoCodes: PromoCodeRow[]
}

export default function PromoCodesPageClient({ promoCodes }: PromoCodesPageClientProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'flat_ghs'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createPromoCode({
        code,
        discountType,
        discountValue: Number(discountValue),
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt || null,
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      setCode('')
      setDiscountValue('')
      setMaxUses('')
      setExpiresAt('')
      setShowForm(false)
      router.refresh()
    })
  }

  function toggleActive(promoId: string, isActive: boolean) {
    startTransition(async () => {
      await setPromoCodeActive(promoId, !isActive)
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Promo Codes</h1>
          <p className="mt-1 font-body text-sm text-[#9898B8]">
            Create discounts for tuition invoices
          </p>
        </div>
        <Button type="button" variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'New Promo Code'}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-xl bg-white p-6 shadow-card"
        >
          <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
            Create promo code
          </h2>
          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="code">Code</AdminLabel>
              <input
                id="code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={adminFieldClassName}
              />
            </div>
            <div>
              <AdminLabel htmlFor="discountType">Discount type</AdminLabel>
              <select
                id="discountType"
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as 'percentage' | 'flat_ghs')
                }
                className={adminFieldClassName}
              >
                <option value="percentage">Percentage</option>
                <option value="flat_ghs">Flat GHS</option>
              </select>
            </div>
            <div>
              <AdminLabel htmlFor="discountValue">Discount value</AdminLabel>
              <input
                id="discountValue"
                type="number"
                min={0}
                step="0.01"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className={adminFieldClassName}
              />
            </div>
            <div>
              <AdminLabel htmlFor="maxUses">Max uses (optional)</AdminLabel>
              <input
                id="maxUses"
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className={adminFieldClassName}
              />
            </div>
            <div className="sm:col-span-2">
              <AdminLabel htmlFor="expiresAt">Expires at (optional)</AdminLabel>
              <input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={adminFieldClassName}
              />
            </div>
          </div>
          <Button type="submit" variant="primary" className="mt-4" disabled={pending}>
            {pending ? 'Creating…' : 'Create Promo Code'}
          </Button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-[#EFEFF5] bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-[#EFEFF5] bg-[#F7F8FC]">
                {['Code', 'Type', 'Value', 'Uses', 'Expires', 'Active', 'Actions'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-[0.06em] text-[#9898B8]"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center font-body text-sm text-[#9898B8]">
                    No promo codes yet
                  </td>
                </tr>
              ) : (
                promoCodes.map((promo) => (
                  <tr key={promo.id} className="border-b border-[#EFEFF5] hover:bg-[#FAFAFA]">
                    <td className="px-4 py-4 font-mono text-[13px] text-[#C74A86]">
                      {promo.code}
                    </td>
                    <td className="px-4 py-4 font-body text-sm text-[#5A5A7A]">
                      {promo.discount_type === 'percentage'
                        ? `${promo.discount_value}% off`
                        : `GHS ${promo.discount_value} off`}
                    </td>
                    <td className="px-4 py-4 font-body text-sm text-[#1A1A2E]">
                      {promo.discount_type === 'percentage'
                        ? `${promo.discount_value}%`
                        : `GHS ${promo.discount_value}`}
                    </td>
                    <td className="px-4 py-4 font-body text-sm text-[#5A5A7A]">
                      {promo.uses_count} / {promo.max_uses ?? '∞'}
                    </td>
                    <td className="px-4 py-4 font-body text-sm text-[#9898B8]">
                      {promo.expires_at
                        ? formatPaymentDateTime(promo.expires_at)
                        : 'Never'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          promo.is_active
                            ? 'text-[#1E9990] font-body text-xs font-semibold'
                            : 'text-[#9898B8] font-body text-xs font-semibold'
                        }
                      >
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => toggleActive(promo.id, promo.is_active)}
                        className="font-body text-sm font-semibold text-[#5A5A7A] hover:text-[#1A1A2E]"
                      >
                        {promo.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
