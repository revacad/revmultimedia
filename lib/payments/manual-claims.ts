import type { SupabaseClient } from '@supabase/supabase-js'
import type { ManualPaymentClaimRow } from '@/components/admin/payments/PaymentClaimsSection'

export async function fetchPendingManualPaymentClaims(
  supabase: SupabaseClient,
): Promise<ManualPaymentClaimRow[]> {
  const { data, error } = await supabase
    .from('manual_payment_claims')
    .select(
      `
      id,
      transaction_ref,
      created_at,
      invoices(id, reference, total_ghs, applications(full_name, reference))
    `,
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/payments] manual claims fetch failed', error)
    return []
  }

  return (data ?? []).flatMap((row) => {
    const invoiceRaw = row.invoices
    const invoice = Array.isArray(invoiceRaw) ? invoiceRaw[0] : invoiceRaw
    if (!invoice) return []

    const applicationRaw = invoice.applications
    const application = Array.isArray(applicationRaw) ? applicationRaw[0] : applicationRaw

    return [
      {
        id: row.id as string,
        transaction_ref: row.transaction_ref as string,
        created_at: row.created_at as string,
        invoice: {
          id: invoice.id as string,
          reference: invoice.reference as string,
          total_ghs: Number(invoice.total_ghs),
        },
        student: {
          full_name: (application?.full_name as string) ?? 'Applicant',
          reference: (application?.reference as string) ?? '—',
        },
      },
    ]
  })
}
