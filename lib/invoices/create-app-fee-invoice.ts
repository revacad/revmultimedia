import type { SupabaseClient } from '@supabase/supabase-js'
import {
  findExistingInvoiceForType,
  resolveStudentIdForApplication,
} from '@/lib/invoices/create-application-invoice'
import { getSystemSettings } from '@/lib/settings/cache'

export async function createApplicationFeeInvoice(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<
  { invoiceId: string; reference: string; totalGhs: number; created: boolean } | { error: string }
> {
  const existing = await findExistingInvoiceForType(
    supabase,
    applicationId,
    'application_fee',
  )
  if (existing) {
    return {
      invoiceId: existing.id,
      reference: existing.reference,
      totalGhs: existing.total_ghs,
      created: false,
    }
  }

  const settings = await getSystemSettings()
  const feeGhs = Number(settings.application_fee_ghs ?? 100)

  const { data: invoiceRef, error: refError } = await supabase.rpc(
    'generate_invoice_reference',
    { prefix: 'REVAPF' },
  )

  if (refError || !invoiceRef) {
    console.error('generate_invoice_reference (apf) error:', refError)
    return { error: 'Failed to generate application fee invoice reference' }
  }

  const studentId = await resolveStudentIdForApplication(supabase, applicationId)

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      reference: invoiceRef as string,
      type: 'application_fee',
      application_id: applicationId,
      student_id: studentId,
      amount_ghs: feeGhs,
      discount_ghs: 0,
      total_ghs: feeGhs,
      status: 'unpaid',
    })
    .select('id')
    .single()

  if (error || !invoice) {
    console.error('Application fee invoice insert error:', error)
    return { error: 'Failed to create application fee invoice' }
  }

  return {
    invoiceId: invoice.id,
    reference: invoiceRef as string,
    totalGhs: feeGhs,
    created: true,
  }
}
