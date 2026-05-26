import type { SupabaseClient } from '@supabase/supabase-js'

/** Mark a non-tuition invoice as paid (application fee, laptop, etc.). */
export async function markNonTuitionInvoicePaid(
  supabase: SupabaseClient,
  invoiceId: string,
  paymentMethod: string,
  options?: { transactionNote?: string; paystackReference?: string },
): Promise<{ error: string | null }> {
  const now = new Date().toISOString()
  const updatePayload: Record<string, unknown> = {
    status: 'paid',
    payment_method: paymentMethod,
    updated_at: now,
  }
  if (options?.paystackReference) {
    updatePayload.paystack_reference = options.paystackReference
  }
  if (options?.transactionNote) {
    updatePayload.discount_note = options.transactionNote
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updatePayload)
    .eq('id', invoiceId)
    .in('status', ['unpaid', 'partially_paid'])
    .select('id')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Invoice is already paid or waived' }
  }

  return { error: null }
}

export async function markApplicationFeePaid(
  supabase: SupabaseClient,
  invoiceId: string,
  applicationId: string,
  paymentMethod: string,
  options?: { transactionNote?: string; paystackReference?: string },
): Promise<{ error: string | null }> {
  const settled = await markNonTuitionInvoicePaid(
    supabase,
    invoiceId,
    paymentMethod,
    options,
  )
  if (settled.error) {
    return settled
  }

  const now = new Date().toISOString()
  const { error: appError } = await supabase
    .from('applications')
    .update({
      app_fee_paid: true,
      app_fee_paid_at: now,
      updated_at: now,
    })
    .eq('id', applicationId)

  if (appError) {
    return { error: appError.message }
  }

  return { error: null }
}
