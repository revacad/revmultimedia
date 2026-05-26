'use client'

import { Fragment, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import {
  createPaymentType,
  setPaymentTypeActive,
  updatePaymentType,
} from '@/actions/payment-types'
import { PROTECTED_PAYMENT_TYPE_SLUGS } from '@/lib/payments/payment-types'
import { cn } from '@/lib/utils'

export type PaymentTypeAdminRow = {
  id: string
  slug: string
  label: string
  description: string | null
  is_active: boolean
  sort_order: number
  allow_paystack: boolean
}

interface PaymentTypesPageClientProps {
  paymentTypes: PaymentTypeAdminRow[]
}

function isProtectedSlug(slug: string): boolean {
  return PROTECTED_PAYMENT_TYPE_SLUGS.includes(
    slug as (typeof PROTECTED_PAYMENT_TYPE_SLUGS)[number],
  )
}

export default function PaymentTypesPageClient({
  paymentTypes,
}: PaymentTypesPageClientProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [createSlug, setCreateSlug] = useState('')
  const [createLabel, setCreateLabel] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createSortOrder, setCreateSortOrder] = useState('0')

  const [editLabel, setEditLabel] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSortOrder, setEditSortOrder] = useState('0')
  const [editAllowPaystack, setEditAllowPaystack] = useState(false)

  function startEdit(row: PaymentTypeAdminRow) {
    setEditingId(row.id)
    setEditLabel(row.label)
    setEditDescription(row.description ?? '')
    setEditSortOrder(String(row.sort_order))
    setEditAllowPaystack(row.allow_paystack)
    setError(null)
    setShowForm(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setError(null)
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createPaymentType({
        slug: createSlug,
        label: createLabel,
        description: createDescription || undefined,
        sortOrder: Number(createSortOrder),
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      setCreateSlug('')
      setCreateLabel('')
      setCreateDescription('')
      setCreateSortOrder('0')
      setShowForm(false)
      router.refresh()
    })
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setError(null)
    const row = paymentTypes.find((t) => t.id === editingId)
    const protectedSlug = row ? isProtectedSlug(row.slug) : true

    startTransition(async () => {
      const result = await updatePaymentType({
        id: editingId,
        label: editLabel,
        description: editDescription || null,
        sortOrder: Number(editSortOrder),
        allowPaystack: protectedSlug ? undefined : editAllowPaystack,
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      setEditingId(null)
      router.refresh()
    })
  }

  function toggleActive(id: string, isActive: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await setPaymentTypeActive(id, !isActive)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">
            Payment Types
          </h1>
          <p className="mt-1 font-body text-sm text-[#9898B8]">
            Configure invoice categories (tuition, laptop, extras). Application fee and tuition are
            system types.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            setShowForm((v) => !v)
            cancelEdit()
          }}
        >
          {showForm ? 'Cancel' : 'New payment type'}
        </Button>
      </div>

      {error && !editingId && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
            Create payment type
          </h2>
          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="createSlug">Slug</AdminLabel>
              <input
                id="createSlug"
                required
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value)}
                placeholder="laptop_fee"
                className={adminFieldClassName}
              />
              <p className="mt-1 font-body text-xs text-[#9898B8]">
                Lowercase letters, numbers, underscores. Used in invoice records.
              </p>
            </div>
            <div>
              <AdminLabel htmlFor="createLabel">Label</AdminLabel>
              <input
                id="createLabel"
                required
                value={createLabel}
                onChange={(e) => setCreateLabel(e.target.value)}
                placeholder="Laptop fee"
                className={adminFieldClassName}
              />
            </div>
            <div className="sm:col-span-2">
              <AdminLabel htmlFor="createDescription">Description (optional)</AdminLabel>
              <textarea
                id="createDescription"
                rows={2}
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                className={adminFieldClassName}
              />
            </div>
            <div>
              <AdminLabel htmlFor="createSortOrder">Sort order</AdminLabel>
              <input
                id="createSortOrder"
                type="number"
                min={0}
                max={999}
                value={createSortOrder}
                onChange={(e) => setCreateSortOrder(e.target.value)}
                className={adminFieldClassName}
              />
            </div>
          </div>
          <Button type="submit" variant="primary" className="mt-4" disabled={pending}>
            {pending ? 'Creating…' : 'Create payment type'}
          </Button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-[#EFEFF5] bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-[#EFEFF5] bg-[#F7F8FC]">
                {['Label', 'Slug', 'Sort', 'Paystack', 'Status', 'Actions'].map((col) => (
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
              {paymentTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center font-body text-sm text-[#9898B8]"
                  >
                    No payment types yet
                  </td>
                </tr>
              ) : (
                paymentTypes.map((row) => (
                  <Fragment key={row.id}>
                    <tr className="border-b border-[#EFEFF5] hover:bg-[#FAFAFA]">
                      <td className="px-4 py-4 font-body text-sm font-semibold text-[#1A1A2E]">
                        {row.label}
                        {isProtectedSlug(row.slug) && (
                          <span className="ml-2 rounded-full bg-[#F0F0F8] px-2 py-0.5 font-body text-[10px] font-semibold uppercase text-[#9898B8]">
                            System
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-[13px] text-[#C74A86]">
                        {row.slug}
                      </td>
                      <td className="px-4 py-4 font-body text-sm text-[#5A5A7A]">
                        {row.sort_order}
                      </td>
                      <td className="px-4 py-4 font-body text-sm text-[#5A5A7A]">
                        {isProtectedSlug(row.slug)
                          ? '—'
                          : row.allow_paystack
                            ? 'Enabled'
                            : 'Off'}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'font-body text-xs font-semibold',
                            row.is_active ? 'text-[#1E9990]' : 'text-[#9898B8]',
                          )}
                        >
                          {row.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => startEdit(row)}
                            className="font-body text-sm font-semibold text-[#5A5A7A] hover:text-[#1A1A2E]"
                          >
                            Edit
                          </button>
                          {!isProtectedSlug(row.slug) && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => toggleActive(row.id, row.is_active)}
                              className="font-body text-sm font-semibold text-[#5A5A7A] hover:text-[#1A1A2E]"
                            >
                              {row.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {editingId === row.id && (
                      <tr className="border-b border-[#EFEFF5] bg-[#F7F8FC]">
                        <td colSpan={6} className="px-4 py-4">
                          <form onSubmit={handleUpdate} className="space-y-4">
                            <h3 className="font-body text-sm font-semibold text-[#1A1A2E]">
                              Edit {row.label}
                            </h3>
                            {error && (
                              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                {error}
                              </p>
                            )}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <AdminLabel htmlFor={`editLabel-${row.id}`}>Label</AdminLabel>
                                <input
                                  id={`editLabel-${row.id}`}
                                  required
                                  value={editLabel}
                                  onChange={(e) => setEditLabel(e.target.value)}
                                  className={adminFieldClassName}
                                />
                              </div>
                              <div>
                                <AdminLabel htmlFor={`editSort-${row.id}`}>Sort order</AdminLabel>
                                <input
                                  id={`editSort-${row.id}`}
                                  type="number"
                                  min={0}
                                  max={999}
                                  value={editSortOrder}
                                  onChange={(e) => setEditSortOrder(e.target.value)}
                                  className={adminFieldClassName}
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <AdminLabel htmlFor={`editDesc-${row.id}`}>
                                  Description
                                </AdminLabel>
                                <textarea
                                  id={`editDesc-${row.id}`}
                                  rows={2}
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  className={adminFieldClassName}
                                />
                              </div>
                              {!isProtectedSlug(row.slug) && (
                                <div className="sm:col-span-2">
                                  <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={editAllowPaystack}
                                      onChange={(e) => setEditAllowPaystack(e.target.checked)}
                                      className="h-4 w-4 rounded border-[#D8D8E8] text-[#C74A86]"
                                    />
                                    <span className="font-body text-sm text-[#5A5A7A]">
                                      Allow Paystack checkout in student portal (REVINV invoices)
                                    </span>
                                  </label>
                                  <p className="mt-1 font-body text-xs text-[#9898B8]">
                                    Tuition stays bank/MoMo only. Application fee uses its own
                                    Paystack flow.
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-3">
                              <Button type="submit" variant="primary" disabled={pending}>
                                {pending ? 'Saving…' : 'Save changes'}
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={cancelEdit}
                                disabled={pending}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
