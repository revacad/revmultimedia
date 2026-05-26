import type { SupabaseClient } from '@supabase/supabase-js'

export type InvoiceForPortalAccess = {
  id: string
  reference: string
  type: string
  status: string
  r2_key: string | null
  paystack_reference: string | null
  payment_method: string | null
  application_id: string
  student_id: string | null
  total_ghs: number
}

export async function getInvoiceIfOwnedByUser(
  adminSupabase: SupabaseClient,
  authUserId: string,
  invoiceId: string,
): Promise<InvoiceForPortalAccess | null> {
  const { data: invoice, error } = await adminSupabase
    .from('invoices')
    .select(
      'id, reference, type, status, r2_key, paystack_reference, payment_method, application_id, student_id, total_ghs',
    )
    .eq('id', invoiceId)
    .maybeSingle()

  if (error || !invoice) return null

  const { data: application } = await adminSupabase
    .from('applications')
    .select('auth_user_id')
    .eq('id', invoice.application_id)
    .maybeSingle()

  if (application?.auth_user_id === authUserId) {
    return invoice as InvoiceForPortalAccess
  }

  if (invoice.student_id) {
    const { data: student } = await adminSupabase
      .from('students')
      .select('auth_user_id')
      .eq('id', invoice.student_id)
      .maybeSingle()

    if (student?.auth_user_id === authUserId) {
      return invoice as InvoiceForPortalAccess
    }
  }

  return null
}
