import type { SupabaseClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/errors/log'

const SETTLE_ERROR = 'Unable to update payment status. Please try again.'

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
    logServerError('payments/settle-invoice', error, { invoiceId })
    return { error: SETTLE_ERROR }
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
    logServerError('payments/mark-application-fee-paid', appError, { applicationId })
    return { error: SETTLE_ERROR }
  }

  return { error: null }
}

/** If the application fee invoice is paid but the application flag was never set, fix it. */
export async function syncApplicationFeePaidFlag(
  supabase: SupabaseClient,
  applicationId: string,
  invoiceId: string,
): Promise<{ error: string | null }> {
  const { data: application } = await supabase
    .from('applications')
    .select('app_fee_paid')
    .eq('id', applicationId)
    .maybeSingle()

  if (!application || application.app_fee_paid) {
    return { error: null }
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('status, type')
    .eq('id', invoiceId)
    .maybeSingle()

  if (!invoice || invoice.type !== 'application_fee' || invoice.status !== 'paid') {
    return { error: null }
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('applications')
    .update({
      app_fee_paid: true,
      app_fee_paid_at: now,
      updated_at: now,
    })
    .eq('id', applicationId)

  if (error) {
    logServerError('payments/sync-application-fee-paid', error, { applicationId })
    return { error: SETTLE_ERROR }
  }

  return { error: null }
}
