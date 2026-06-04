import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndStorePaystackReceiptPdf, generateAndStoreReceiptPdf } from '@/lib/pdf/generate'
import { sendPaymentReceiptEmail } from '@/lib/notifications/email'
import {
  deliverWhatsAppThenSms,
  logNotification,
} from '@/lib/notifications/log-delivery'
import { r2DocumentAbsoluteUrl } from '@/lib/r2/document-url'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'
import { formatInvoiceType } from '@/lib/payments/format-invoice-type'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function sendPaymentReceiptNotification(options: {
  invoiceId: string
  applicationId: string
  installmentId?: string
  amountPaidGhs: number
  paymentMethod: string
  transactionRef?: string | null
  paidAt: string
  fullyPaid: boolean
  totalPaidGhs?: number
  remainingGhs?: number
}): Promise<void> {
  const supabase = createAdminClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select(
      `
      reference, type, total_ghs,
      payment_types(label),
      applications(real_email, full_name, phone)
    `,
    )
    .eq('id', options.invoiceId)
    .single()

  if (!invoice) return

  const application = firstRelation(
    invoice.applications as
      | { real_email: string; full_name: string; phone: string }
      | { real_email: string; full_name: string; phone: string }[]
      | null,
  )
  if (!application) return

  const paymentType = firstRelation(
    invoice.payment_types as { label: string } | { label: string }[] | null,
  )
  const paymentForLabel = formatInvoiceType(invoice.type, paymentType?.label)

  let receiptPdfUrl = ''
  let pdfKey: string | null = null
  if (options.installmentId) {
    pdfKey = await generateAndStoreReceiptPdf(options.installmentId)
  } else if (options.paymentMethod === 'paystack' && options.transactionRef) {
    pdfKey = await generateAndStorePaystackReceiptPdf(
      options.invoiceId,
      options.transactionRef,
    )
  }
  if (pdfKey) {
    receiptPdfUrl = r2DocumentAbsoluteUrl(normalizeR2ObjectKey(pdfKey))
  }

  try {
    await sendPaymentReceiptEmail(application.real_email, {
      name: application.full_name,
      invoiceReference: invoice.reference,
      paymentForLabel,
      amountPaidGhs: options.amountPaidGhs,
      totalInvoiceGhs: Number(invoice.total_ghs),
      totalPaidGhs: options.totalPaidGhs ?? options.amountPaidGhs,
      remainingGhs: options.remainingGhs ?? 0,
      fullyPaid: options.fullyPaid,
      paymentMethod: options.paymentMethod,
      receiptPdfUrl: receiptPdfUrl || undefined,
    })
    await logNotification(supabase, {
      applicationId: options.applicationId,
      channel: 'email',
      eventType: 'payment_confirmed',
      recipient: application.real_email,
      status: 'sent',
    })
  } catch (err) {
    await logNotification(supabase, {
      applicationId: options.applicationId,
      channel: 'email',
      eventType: 'payment_confirmed',
      recipient: application.real_email,
      status: 'failed',
      providerResponse: {
        error: err instanceof Error ? err.message : 'Payment receipt email failed',
      },
    })
  }

  const smsAmount = options.amountPaidGhs.toFixed(2)
  const smsBody = options.fullyPaid
    ? `Rev Multimedia: Your ${paymentForLabel} invoice ${invoice.reference} is paid in full (GHS ${smsAmount}). Thank you!`
    : `Rev Multimedia: Payment of GHS ${smsAmount} recorded for ${paymentForLabel} (${invoice.reference}). Balance remaining on your invoice.`

  await deliverWhatsAppThenSms({
    phone: application.phone,
    message: smsBody,
    applicationId: options.applicationId,
    eventType: 'payment_confirmed',
    supabase,
  })
}
