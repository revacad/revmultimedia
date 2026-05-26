import type { SupabaseClient } from '@supabase/supabase-js'

export type PortalInvoiceRow = {
  id: string
  reference: string
  type: string
  total_ghs: number
  amount_ghs: number
  due_date: string | null
  created_at: string | null
  status: string
  paystack_reference: string | null
  payment_method: string | null
  payment_types: { label: string; slug: string; allow_paystack: boolean } | null
  applications: { reference: string; real_email: string } | null
  installments: { id: string; amount_ghs: number; paid_at: string }[]
}

function normalizePaymentType(
  value: PortalInvoiceRow['payment_types'] | PortalInvoiceRow['payment_types'][] | null,
): PortalInvoiceRow['payment_types'] {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function fetchPortalInvoicesForUser(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<PortalInvoiceRow[]> {
  const [{ data: applications }, { data: student }] = await Promise.all([
    supabase.from('applications').select('id').eq('auth_user_id', authUserId),
    supabase
      .from('students')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle(),
  ])

  const applicationIds = (applications ?? []).map((a) => a.id)

  let query = supabase
    .from('invoices')
    .select(
      `id, reference, type, total_ghs, amount_ghs, due_date, created_at, status,
      paystack_reference, payment_method,
      payment_types(label, slug, allow_paystack),
      applications(reference, real_email),
      installments(id, amount_ghs, paid_at)`,
    )
    .order('created_at', { ascending: false })

  if (student?.id && applicationIds.length > 0) {
    query = query.or(
      `student_id.eq.${student.id},application_id.in.(${applicationIds.join(',')})`,
    )
  } else if (student?.id) {
    query = query.eq('student_id', student.id)
  } else if (applicationIds.length > 0) {
    query = query.in('application_id', applicationIds)
  } else {
    return []
  }

  const { data, error } = await query

  if (error) {
    console.error('[portal/invoices] fetch failed', error)
    return []
  }

  const seen = new Set<string>()
  const rows: PortalInvoiceRow[] = []

  for (const row of data ?? []) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    rows.push({
      id: row.id,
      reference: row.reference,
      type: row.type,
      total_ghs: Number(row.total_ghs),
      amount_ghs: Number(row.amount_ghs),
      due_date: row.due_date,
      created_at: (row.created_at as string | null) ?? null,
      status: row.status,
      paystack_reference: (row.paystack_reference as string | null) ?? null,
      payment_method: (row.payment_method as string | null) ?? null,
      payment_types: normalizePaymentType(
        row.payment_types as PortalInvoiceRow['payment_types'] | PortalInvoiceRow['payment_types'][],
      ),
      applications: (() => {
        const app = row.applications as
          | PortalInvoiceRow['applications']
          | PortalInvoiceRow['applications'][]
          | null
        if (!app) return null
        return Array.isArray(app) ? (app[0] ?? null) : app
      })(),
      installments: (
        (row.installments as { id: string; amount_ghs: number; paid_at: string }[]) ?? []
      ).map((inst) => ({
        id: inst.id,
        amount_ghs: Number(inst.amount_ghs),
        paid_at: inst.paid_at,
      })),
    })
  }

  return rows
}
