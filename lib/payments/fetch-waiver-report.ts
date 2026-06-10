import type { SupabaseClient } from '@supabase/supabase-js'

export type WaiverReportRow = {
  id: string
  amountGhs: number
  waiverReason: string
  paidAt: string
  invoiceRef: string
  studentName: string
  adminName: string
}

export async function fetchWaiverReport(
  supabase: SupabaseClient,
  options?: { from?: string; to?: string },
): Promise<{ rows: WaiverReportRow[]; totalGhs: number }> {
  let query = supabase
    .from('installments')
    .select(
      `
      id,
      amount_ghs,
      waiver_reason,
      paid_at,
      admins(full_name),
      invoices(reference, applications(full_name))
    `,
    )
    .eq('payment_method', 'waiver')
    .order('paid_at', { ascending: false })

  if (options?.from) {
    query = query.gte('paid_at', options.from)
  }
  if (options?.to) {
    query = query.lte('paid_at', options.to)
  }

  const { data, error } = await query

  if (error) {
    console.error('[payments] fetchWaiverReport failed', { message: error.message })
    return { rows: [], totalGhs: 0 }
  }

  const rows: WaiverReportRow[] = (data ?? []).map((row) => {
    const invoiceRaw = row.invoices as
      | { reference: string; applications: { full_name: string } | { full_name: string }[] | null }
      | { reference: string; applications: { full_name: string } | { full_name: string }[] | null }[]
      | null
    const invoice = Array.isArray(invoiceRaw) ? (invoiceRaw[0] ?? null) : invoiceRaw
    const appRaw = invoice?.applications
    const application = Array.isArray(appRaw) ? (appRaw[0] ?? null) : appRaw
    const adminRaw = row.admins as { full_name: string } | { full_name: string }[] | null
    const admin = Array.isArray(adminRaw) ? (adminRaw[0] ?? null) : adminRaw

    return {
      id: row.id as string,
      amountGhs: Number(row.amount_ghs),
      waiverReason: (row.waiver_reason as string) ?? 'Other',
      paidAt: row.paid_at as string,
      invoiceRef: invoice?.reference ?? '',
      studentName: application?.full_name ?? '',
      adminName: admin?.full_name ?? 'Admin',
    }
  })

  const totalGhs = rows.reduce((sum, row) => sum + row.amountGhs, 0)
  return { rows, totalGhs }
}
