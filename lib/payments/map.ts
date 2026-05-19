import type { InvoiceDetail, PaymentListRow } from '@/lib/payments/types'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export function mapPaymentListRow(row: Record<string, unknown>): PaymentListRow {
  const applications = firstRelation(
    row.applications as PaymentListRow['applications'] | PaymentListRow['applications'][] | null,
  )
  const admins = firstRelation(
    row.admins as PaymentListRow['admins'] | PaymentListRow['admins'][] | null,
  )
  const installments = (row.installments as PaymentListRow['installments']) ?? []

  return {
    id: row.id as string,
    reference: row.reference as string,
    type: row.type as PaymentListRow['type'],
    amount_ghs: Number(row.amount_ghs),
    discount_ghs: Number(row.discount_ghs),
    total_ghs: Number(row.total_ghs),
    due_date: (row.due_date as string | null) ?? null,
    status: row.status as PaymentListRow['status'],
    payment_method: (row.payment_method as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    applications,
    installments: installments.map((i) => ({ amount_ghs: Number(i.amount_ghs) })),
    admins,
  }
}

export function mapInvoiceDetail(row: Record<string, unknown>): InvoiceDetail {
  const applicationsRaw = firstRelation(
    row.applications as Record<string, unknown> | Record<string, unknown>[] | null,
  )
  const applications = applicationsRaw
    ? {
        id: applicationsRaw.id as string,
        reference: applicationsRaw.reference as string,
        full_name: applicationsRaw.full_name as string,
        real_email: applicationsRaw.real_email as string,
        phone: applicationsRaw.phone as string,
        country: applicationsRaw.country as string,
        courses: firstRelation(
          applicationsRaw.courses as { title: string } | { title: string }[] | null,
        ),
        intakes: firstRelation(
          applicationsRaw.intakes as
            | { name: string; start_date: string }
            | { name: string; start_date: string }[]
            | null,
        ),
      }
    : null

  const installments = ((row.installments as Record<string, unknown>[]) ?? [])
    .map((inst) => ({
    id: inst.id as string,
    amount_ghs: Number(inst.amount_ghs),
    payment_method: inst.payment_method as string,
    transaction_ref: (inst.transaction_ref as string | null) ?? null,
    payment_note: (inst.payment_note as string | null) ?? null,
    paid_at: inst.paid_at as string,
    admins: firstRelation(
      inst.admins as { full_name: string } | { full_name: string }[] | null,
    ),
  }))
    .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())

  return {
    id: row.id as string,
    reference: row.reference as string,
    type: row.type as InvoiceDetail['type'],
    amount_ghs: Number(row.amount_ghs),
    discount_ghs: Number(row.discount_ghs),
    total_ghs: Number(row.total_ghs),
    due_date: (row.due_date as string | null) ?? null,
    status: row.status as InvoiceDetail['status'],
    payment_method: (row.payment_method as string | null) ?? null,
    discount_note: (row.discount_note as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    application_id: row.application_id as string,
    promo_codes: firstRelation(
      row.promo_codes as InvoiceDetail['promo_codes'] | NonNullable<InvoiceDetail['promo_codes']>[] | null,
    ),
    applications,
    installments,
    admins: firstRelation(
      row.admins as InvoiceDetail['admins'] | InvoiceDetail['admins'][] | null,
    ),
  }
}
