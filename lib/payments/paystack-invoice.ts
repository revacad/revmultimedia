import type { SupabaseClient } from '@supabase/supabase-js'

export function isPaystackInvoiceReference(ref: string): boolean {
  return ref.startsWith('REVAPF') || ref.startsWith('REVINV')
}

/** Resolve our invoice reference from Paystack metadata and/or transaction ref. */
export function resolvePaystackInvoiceRef(
  metadata: Record<string, unknown> | undefined,
  paystackReference: string,
): string | null {
  if (metadata) {
    const direct = metadata.invoiceRef
    if (typeof direct === 'string' && isPaystackInvoiceReference(direct)) {
      return direct
    }

    const customFields = metadata.custom_fields
    if (Array.isArray(customFields)) {
      for (const field of customFields) {
        if (!field || typeof field !== 'object') continue
        const row = field as Record<string, unknown>
        const name = row.variable_name ?? row.display_name
        const value = row.value
        if (
          (name === 'invoiceRef' || name === 'invoice_ref') &&
          typeof value === 'string' &&
          isPaystackInvoiceReference(value)
        ) {
          return value
        }
      }
    }
  }

  if (isPaystackInvoiceReference(paystackReference)) {
    return paystackReference
  }

  const dash = paystackReference.indexOf('-')
  if (dash > 0) {
    const prefix = paystackReference.slice(0, dash)
    if (isPaystackInvoiceReference(prefix)) {
      return prefix
    }
  }

  return null
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
