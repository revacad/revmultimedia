import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndStorePaystackReceiptPdf, generateAndStoreReceiptPdf } from '@/lib/pdf/generate'
import { sendPaymentReceiptEmail } from '@/lib/notifications/email'
import { sendMessage } from '@/lib/notifications/sms'
import { generatePresignedDownloadUrl } from '@/lib/r2/presign'
import { paymentTypeLabelFromSlug } from '@/lib/payments/payment-types'

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
  const paymentForLabel =
    paymentType?.label ?? paymentTypeLabelFromSlug(invoice.type)

  let receiptPdfUrl = ''
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  let pdfKey: string | null = null
  if (options.installmentId) {
    pdfKey = await generateAndStoreReceiptPdf(options.installmentId)
  } else if (options.paymentMethod === 'paystack' && options.transactionRef) {
    pdfKey = await generateAndStorePaystackReceiptPdf(
      options.invoiceId,
      options.transactionRef,
    )
  }
  if (pdfKey && bucket) {
    receiptPdfUrl = await generatePresignedDownloadUrl(bucket, pdfKey, 86400 * 7)
  }

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

  const smsAmount = options.amountPaidGhs.toFixed(2)
  await sendMessage(
    application.phone,
    options.fullyPaid
      ? `Rev Multimedia: Payment of GHS ${smsAmount} received for ${paymentForLabel} (${invoice.reference}). Thank you!`
      : `Rev Multimedia: Payment of GHS ${smsAmount} recorded for ${invoice.reference}. Balance remaining on your invoice.`,
    'sms',
  )
}
