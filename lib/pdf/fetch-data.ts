import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdmissionLetterPdfData } from '@/lib/pdf/AdmissionLetterDocument'
import type { InvoicePdfData } from '@/lib/pdf/InvoiceDocument'
import type { ReceiptPdfData } from '@/lib/pdf/ReceiptDocument'
import { formatPaymentDate, sumInstallments } from '@/lib/payments/format'
import { paymentTypeLabelFromSlug } from '@/lib/payments/payment-types'
import { getSystemSettings } from '@/lib/settings/cache'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function fetchInvoicePdfData(
  supabase: SupabaseClient,
  invoiceId: string,
): Promise<InvoicePdfData | null> {
  const { data: invoice } = await supabase
    .from('invoices')
    .select(
      `
      reference, type, amount_ghs, discount_ghs, total_ghs, due_date, status, discount_note,
      payment_types(label),
      applications(reference, full_name, real_email)
    `,
    )
    .eq('id', invoiceId)
    .maybeSingle()

  if (!invoice) return null

  const application = firstRelation(
    invoice.applications as
      | { reference: string; full_name: string; real_email: string }
      | { reference: string; full_name: string; real_email: string }[]
      | null,
  )
  const paymentType = firstRelation(
    invoice.payment_types as { label: string } | { label: string }[] | null,
  )

  const settings = await getSystemSettings()

  return {
    reference: invoice.reference,
    paymentForLabel: paymentType?.label ?? paymentTypeLabelFromSlug(invoice.type),
    studentName: application?.full_name ?? 'Student',
    studentEmail: application?.real_email ?? '',
    applicationReference: application?.reference ?? '',
    amountGhs: Number(invoice.amount_ghs),
    discountGhs: Number(invoice.discount_ghs),
    totalGhs: Number(invoice.total_ghs),
    dueDate: invoice.due_date ? formatPaymentDate(invoice.due_date) : null,
    status: invoice.status,
    notes: invoice.discount_note,
    momoNumber: settings.momo_number_1 || undefined,
    momoName: settings.momo_name_1 || undefined,
    bankName: settings.bank_name || undefined,
    bankAccount: settings.bank_account_number || undefined,
    bankAccountName: settings.bank_account_name || undefined,
  }
}

export async function fetchReceiptPdfData(
  supabase: SupabaseClient,
  installmentId: string,
): Promise<ReceiptPdfData | null> {
  const { data: installment } = await supabase
    .from('installments')
    .select(
      `
      id, amount_ghs, payment_method, transaction_ref, paid_at,
      invoices(
        reference, type, total_ghs,
        payment_types(label),
        applications(full_name),
        installments(amount_ghs)
      )
    `,
    )
    .eq('id', installmentId)
    .maybeSingle()

  if (!installment) return null

  const invoice = firstRelation(
    installment.invoices as Record<string, unknown> | Record<string, unknown>[] | null,
  )
  if (!invoice) return null

  const application = firstRelation(
    invoice.applications as { full_name: string } | { full_name: string }[] | null,
  )
  const paymentType = firstRelation(
    invoice.payment_types as { label: string } | { label: string }[] | null,
  )
  const allInstallments = (invoice.installments as { amount_ghs: number }[]) ?? []
  const totalPaid = sumInstallments(allInstallments)
  const totalInvoice = Number(invoice.total_ghs)
  const amountPaid = Number(installment.amount_ghs)

  return {
    receiptId: installment.id,
    invoiceReference: invoice.reference as string,
    paymentForLabel:
      paymentType?.label ?? paymentTypeLabelFromSlug(invoice.type as string),
    studentName: application?.full_name ?? 'Student',
    amountPaidGhs: amountPaid,
    totalInvoiceGhs: totalInvoice,
    totalPaidGhs: totalPaid,
    remainingGhs: Math.max(0, totalInvoice - totalPaid),
    paymentMethod: installment.payment_method,
    transactionRef: installment.transaction_ref,
    paidAt: formatPaymentDate(installment.paid_at),
    fullyPaid: totalPaid >= totalInvoice,
  }
}

export async function fetchAdmissionLetterPdfData(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<AdmissionLetterPdfData | null> {
  const { data: application } = await supabase
    .from('applications')
    .select(
      `
      reference, full_name,
      courses(title),
      intakes(name, start_date)
    `,
    )
    .eq('id', applicationId)
    .maybeSingle()

  if (!application) return null

  const course = firstRelation(
    application.courses as { title: string } | { title: string }[] | null,
  )
  const intake = firstRelation(
    application.intakes as
      | { name: string; start_date: string }
      | { name: string; start_date: string }[]
      | null,
  )

  const settings = await getSystemSettings()

  return {
    studentName: application.full_name,
    applicationReference: application.reference,
    courseTitle: course?.title ?? 'Programme',
    intakeName: intake?.name ?? '',
    intakeStartDate: intake?.start_date
      ? formatPaymentDate(intake.start_date)
      : '',
    issuedDate: formatPaymentDate(new Date().toISOString()),
    academyName: 'Rev Multimedia',
    academyEmail: settings.academy_email || 'info@revmultimedia.com',
    academyPhone: settings.academy_phone || '',
  }
}
