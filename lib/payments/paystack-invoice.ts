import type { SupabaseClient } from '@supabase/supabase-js'

export function isPaystackInvoiceReference(ref: string): boolean {
  return ref.startsWith('REVAPF') || ref.startsWith('REVINV')
}

export async function canPaystackSettleInvoice(
  supabase: SupabaseClient,
  invoice: { type: string; payment_type_id: string | null },
): Promise<boolean> {
  if (invoice.type === 'application_fee') {
    return true
  }

  if (invoice.type === 'tuition') {
    return false
  }

  if (!invoice.payment_type_id) {
    return false
  }

  const { data: paymentType } = await supabase
    .from('payment_types')
    .select('allow_paystack')
    .eq('id', invoice.payment_type_id)
    .maybeSingle()

  return Boolean(paymentType?.allow_paystack)
}
