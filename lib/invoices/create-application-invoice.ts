import type { SupabaseClient } from '@supabase/supabase-js'
import { logAuditEvent } from '@/lib/audit/log'
import { generateAndStoreInvoicePdf } from '@/lib/pdf/generate'
import { sendInvoiceReadyEmail } from '@/lib/notifications/email'
import { sendMessage } from '@/lib/notifications/sms'
import { defaultDueDate } from '@/lib/payments/format'
import {
  getPaymentTypeIdBySlug,
  PROTECTED_PAYMENT_TYPE_SLUGS,
} from '@/lib/payments/payment-types'
import { fetchPromoById, validatePromoRow } from '@/lib/promo/validate'
import { getSystemSettings } from '@/lib/settings/cache'
import { generatePresignedDownloadUrl } from '@/lib/r2/presign'

export type ApplicationForInvoice = {
  id: string
  reference: string
  full_name: string
  real_email: string
  phone: string
  country: string
  courses?: { tuition_fee_ghs: number } | { tuition_fee_ghs: number }[] | null
}

export type CreateApplicationInvoiceInput = {
  applicationId: string
  adminId: string
  paymentTypeSlug: string
  paymentTypeLabel: string
  amountGhs: number
  discountGhs?: number
  promoCodeId?: string | null
  dueDate?: string
  notes?: string
  allowInstallments?: boolean
  installmentCount?: number
}

const SINGLE_INVOICE_PER_APPLICATION = new Set<string>(PROTECTED_PAYMENT_TYPE_SLUGS)

export async function resolveStudentIdForApplication(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<string | null> {
  const { data: application } = await supabase
    .from('applications')
    .select('auth_user_id')
    .eq('id', applicationId)
    .maybeSingle()

  if (!application?.auth_user_id) return null

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('auth_user_id', application.auth_user_id)
    .maybeSingle()

  return student?.id ?? null
}

export async function findExistingInvoiceForType(
  supabase: SupabaseClient,
  applicationId: string,
  paymentTypeSlug: string,
): Promise<{ id: string; reference: string; total_ghs: number } | null> {
  if (!SINGLE_INVOICE_PER_APPLICATION.has(paymentTypeSlug)) {
    return null
  }

  const { data } = await supabase
    .from('invoices')
    .select('id, reference, total_ghs')
    .eq('application_id', applicationId)
    .eq('type', paymentTypeSlug)
    .maybeSingle()

  return data
    ? {
        id: data.id,
        reference: data.reference,
        total_ghs: Number(data.total_ghs),
      }
    : null
}

export async function createApplicationInvoice(
  supabase: SupabaseClient,
  application: ApplicationForInvoice,
  input: CreateApplicationInvoiceInput,
): Promise<
  { invoiceId: string; reference: string; totalGhs: number; created: boolean } | { error: string }
> {
  if (input.paymentTypeSlug === 'application_fee') {
    return { error: 'Application fee invoices are created automatically when a student applies' }
  }

  const existing = await findExistingInvoiceForType(
    supabase,
    input.applicationId,
    input.paymentTypeSlug,
  )
  if (existing) {
    return {
      invoiceId: existing.id,
      reference: existing.reference,
      totalGhs: existing.total_ghs,
      created: false,
    }
  }

  const amountGhs = input.amountGhs
  const discountGhs = input.discountGhs ?? 0
  const promoCodeId = input.promoCodeId ?? null
  const totalGhs = Math.max(0, amountGhs - discountGhs)
  const dueDate = input.dueDate ?? defaultDueDate(14)

  const paymentTypeId = await getPaymentTypeIdBySlug(supabase, input.paymentTypeSlug)
  if (!paymentTypeId) {
    return { error: 'Payment type is not available. Check Payment Types in admin settings.' }
  }

  const { data: invoiceRef, error: refError } = await supabase.rpc('generate_invoice_ref', {
    p_type: 'inv',
  })

  if (refError || !invoiceRef) {
    console.error('generate_invoice_ref error:', refError)
    return { error: 'Failed to generate invoice reference' }
  }

  const noteParts = [
    input.notes?.trim(),
    input.allowInstallments
      ? `Installment plan: ${input.installmentCount ?? 2} payments allowed`
      : null,
  ].filter(Boolean)

  const studentId = await resolveStudentIdForApplication(supabase, input.applicationId)

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      reference: invoiceRef as string,
      type: input.paymentTypeSlug,
      payment_type_id: paymentTypeId,
      application_id: input.applicationId,
      student_id: studentId,
      amount_ghs: amountGhs,
      discount_ghs: discountGhs,
      promo_code_id: promoCodeId,
      total_ghs: totalGhs,
      due_date: dueDate,
      status: 'unpaid',
      discount_note: noteParts.length > 0 ? noteParts.join('\n') : null,
      created_by_admin_id: input.adminId,
    })
    .select('id')
    .single()

  if (error || !invoice) {
    console.error('Invoice creation error:', error)
    return { error: 'Failed to create invoice' }
  }

  if (promoCodeId) {
    const promo = await fetchPromoById(supabase, promoCodeId)
    const usageCheck = validatePromoRow(promo, { checkUsageLimit: true })
    if (usageCheck.ok) {
      await supabase
        .from('promo_codes')
        .update({ uses_count: (usageCheck.promo.uses_count ?? 0) + 1 })
        .eq('id', promoCodeId)
    }
  }

  await logAuditEvent({
    adminId: input.adminId,
    action: 'invoice.generated',
    entityType: 'invoice',
    entityId: invoice.id,
    newValue: {
      reference: invoiceRef,
      amount: totalGhs,
      paymentType: input.paymentTypeSlug,
    },
  })

  return {
    invoiceId: invoice.id,
    reference: invoiceRef as string,
    totalGhs,
    created: true,
  }
}

export async function sendApplicationInvoiceNotifications(
  application: Pick<ApplicationForInvoice, 'real_email' | 'full_name' | 'phone' | 'country'>,
  reference: string,
  totalGhs: number,
  dueDate: string,
  invoiceId: string,
  paymentTypeLabel: string,
): Promise<void> {
  const pdfKey = await generateAndStoreInvoicePdf(invoiceId)
  let pdfUrl = ''
  if (pdfKey) {
    const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
    if (bucket) {
      pdfUrl = await generatePresignedDownloadUrl(bucket, pdfKey, 86400)
    }
  }

  const settings = await getSystemSettings()

  await sendInvoiceReadyEmail(application.real_email, {
    name: application.full_name,
    reference,
    amountGhs: totalGhs,
    dueDate,
    invoiceLabel: paymentTypeLabel,
    isInternational: application.country !== 'Ghana',
    momoNumber: settings.momo_number_1 || undefined,
    momoName: settings.momo_name_1 || undefined,
    bankName: settings.bank_name || undefined,
    bankAccount: settings.bank_account_number || undefined,
    bankAccountName: settings.bank_account_name || undefined,
    swiftCode: settings.bank_swift_code || undefined,
    pdfUrl,
  })

  await sendMessage(
    application.phone,
    `Rev Multimedia: Your ${paymentTypeLabel.toLowerCase()} invoice ${reference} for GHS ${totalGhs.toFixed(2)} is ready. Check your email for payment instructions.`,
    'sms',
  )
}
