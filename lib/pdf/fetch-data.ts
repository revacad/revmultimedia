import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdmissionLetterPdfData } from '@/lib/pdf/AdmissionLetterDocument'
import type { InvoicePdfData } from '@/lib/pdf/InvoiceDocument'
import type { ReceiptPdfData } from '@/lib/pdf/ReceiptDocument'
import { roundGhs } from '@/lib/payments/balance'
import { getEffectiveInvoiceBalance } from '@/lib/payments/guards'
import { formatPaymentDate, sumInstallments } from '@/lib/payments/format'
import { formatInvoiceType } from '@/lib/payments/format-invoice-type'
import { getMomoProviderName } from '@/lib/settings/momo-provider'
import { formatCourseEnrollmentLine, formatLetterDate } from '@/lib/pdf/letter-format'
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
      applications(reference, full_name, real_email, courses(title), intakes(name))
    `,
    )
    .eq('id', invoiceId)
    .maybeSingle()

  if (!invoice) return null

  const application = firstRelation(
    invoice.applications as
      | {
          reference: string
          full_name: string
          real_email: string
          courses: { title: string } | { title: string }[] | null
          intakes: { name: string } | { name: string }[] | null
        }
      | {
          reference: string
          full_name: string
          real_email: string
          courses: { title: string } | { title: string }[] | null
          intakes: { name: string } | { name: string }[] | null
        }[]
      | null,
  )
  const paymentType = firstRelation(
    invoice.payment_types as { label: string } | { label: string }[] | null,
  )

  const settings = await getSystemSettings()
  const course = application ? firstRelation(application.courses) : null
  const intake = application ? firstRelation(application.intakes) : null

  return {
    reference: invoice.reference,
    paymentForLabel: formatInvoiceType(invoice.type, paymentType?.label),
    courseTitle: course?.title ?? null,
    intakeName: intake?.name ?? null,
    studentName: application?.full_name ?? 'Student',
    studentEmail: application?.real_email ?? '',
    applicationReference: application?.reference ?? '',
    amountGhs: Number(invoice.amount_ghs),
    discountGhs: Number(invoice.discount_ghs),
    totalGhs: Number(invoice.total_ghs),
    dueDate: invoice.due_date ? formatPaymentDate(invoice.due_date) : null,
    issuedDate: formatPaymentDate(new Date()),
    status: invoice.status,
    notes: invoice.discount_note,
    momoProvider: getMomoProviderName(settings),
    momoNumber: settings.momo_number_1 || undefined,
    momoName: settings.momo_name_1 || undefined,
    bankName: settings.bank_name || undefined,
    bankAccount: settings.bank_account_number || undefined,
    bankAccountName: settings.bank_account_name || undefined,
    academyEmail: settings.academy_email || 'info@revmultimediagh.com',
    academyWebsite: settings.academy_website || 'revmultimedia.com',
    academyPhone: settings.academy_phone || '+233 27 581 8525',
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
        reference, type, total_ghs, status,
        payment_types(label),
        applications(full_name, real_email, courses(title), intakes(name)),
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
    invoice.applications as
      | {
          full_name: string
          real_email: string
          courses: { title: string } | { title: string }[] | null
          intakes: { name: string } | { name: string }[] | null
        }
      | {
          full_name: string
          real_email: string
          courses: { title: string } | { title: string }[] | null
          intakes: { name: string } | { name: string }[] | null
        }[]
      | null,
  )
  const paymentType = firstRelation(
    invoice.payment_types as { label: string } | { label: string }[] | null,
  )
  const allInstallments = (invoice.installments as { amount_ghs: number }[]) ?? []
  const totalPaid = sumInstallments(allInstallments)
  const totalInvoice = Number(invoice.total_ghs)
  const amountPaid = Number(installment.amount_ghs)

  const course = application ? firstRelation(application.courses) : null
  const intake = application ? firstRelation(application.intakes) : null
  const settings = await getSystemSettings()

  return {
    receiptId: installment.id,
    invoiceReference: invoice.reference as string,
    paymentForLabel: formatInvoiceType(invoice.type as string, paymentType?.label),
    courseTitle: course?.title ?? null,
    intakeName: intake?.name ?? null,
    studentName: application?.full_name ?? 'Student',
    studentEmail: application?.real_email ?? '',
    amountPaidGhs: amountPaid,
    totalInvoiceGhs: totalInvoice,
    totalPaidGhs: totalPaid,
    remainingGhs: Math.max(0, totalInvoice - totalPaid),
    paymentMethod: installment.payment_method,
    transactionRef: installment.transaction_ref,
    paidAt: formatPaymentDate(installment.paid_at),
    fullyPaid:
      invoice.status === 'paid' || totalPaid >= totalInvoice - 0.005,
    academyEmail: settings.academy_email || 'info@revmultimediagh.com',
    academyWebsite: settings.academy_website || 'revmultimedia.com',
    academyPhone: settings.academy_phone || '+233 27 581 8525',
  }
}

export async function fetchAdmissionLetterPdfData(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<AdmissionLetterPdfData | null> {
  const { data: application, error: applicationError } = await supabase
    .from('applications')
    .select(
      `
      reference, full_name,
      courses(title, tuition_fee_ghs),
      intakes(name, start_date),
      students:students!students_application_id_fkey(student_id),
      returning_student:students!applications_returning_student_id_fkey(student_id),
      invoices(
        type, status, total_ghs, payment_method, paystack_reference,
        installments(amount_ghs)
      )
    `,
    )
    .eq('id', applicationId)
    .maybeSingle()

  if (applicationError) {
    console.error('[pdf] fetchAdmissionLetterPdfData failed', {
      message: applicationError.message,
      code: applicationError.code,
      details: applicationError.details,
    })
    return null
  }

  if (!application) return null

  const course = firstRelation(
    application.courses as
      | { title: string; tuition_fee_ghs: number }
      | { title: string; tuition_fee_ghs: number }[]
      | null,
  )
  const intake = firstRelation(
    application.intakes as
      | { name: string; start_date: string }
      | { name: string; start_date: string }[]
      | null,
  )

  const invoices =
    (application.invoices as {
      type: string
      status: string
      total_ghs: number
      payment_method: string | null
      paystack_reference: string | null
      installments?: { amount_ghs: number }[] | null
    }[]) ?? []

  const tuitionInvoice = invoices.find((inv) => inv.type === 'tuition')
  const tuitionBalance = tuitionInvoice
    ? getEffectiveInvoiceBalance(
        {
          status: tuitionInvoice.status,
          total_ghs: Number(tuitionInvoice.total_ghs),
          payment_method: tuitionInvoice.payment_method,
          paystack_reference: tuitionInvoice.paystack_reference,
        },
        tuitionInvoice.installments ?? [],
      )
    : null

  const totalCourseFeeGhs = roundGhs(
    tuitionInvoice
      ? Number(tuitionInvoice.total_ghs)
      : Number(course?.tuition_fee_ghs ?? 0),
  )
  const amountPaidGhs = roundGhs(tuitionBalance?.paid ?? 0)
  const outstandingBalanceGhs = roundGhs(
    tuitionBalance?.remaining ??
      Math.max(0, totalCourseFeeGhs - amountPaidGhs),
  )

  const enrolledStudent = firstRelation(
    application.students as { student_id: string } | { student_id: string }[] | null,
  )
  const returningStudent = firstRelation(
    application.returning_student as { student_id: string } | { student_id: string }[] | null,
  )

  const settings = await getSystemSettings()
  const courseTitle = course?.title?.trim() || 'Programme'
  const intakeName = intake?.name?.trim() ?? ''

  return {
    studentName: application.full_name?.trim() || 'Student',
    applicationReference: application.reference,
    permanentStudentId:
      enrolledStudent?.student_id ?? returningStudent?.student_id ?? null,
    courseTitle,
    intakeName,
    courseEnrollmentLine: formatCourseEnrollmentLine(courseTitle, intakeName),
    intakeStartDate: intake?.start_date ? formatLetterDate(intake.start_date) : '',
    issuedDate: formatLetterDate(new Date()),
    totalCourseFeeGhs,
    amountPaidGhs,
    outstandingBalanceGhs,
    academyName: 'Rev Multimedia',
    academyEmail: settings.academy_email || 'info@revmultimediagh.com',
    academyPhone: settings.academy_phone || '+233 27 581 8525',
    signatoryName:
      settings.enrollment_letter_signatory_name?.trim() || 'Godfred Ferdinand Appiah',
    signatoryTitle: settings.enrollment_letter_signatory_title?.trim() || 'President',
  }
}
