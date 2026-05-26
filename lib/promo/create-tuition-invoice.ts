import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createApplicationInvoice,
  sendApplicationInvoiceNotifications,
  type ApplicationForInvoice,
} from '@/lib/invoices/create-application-invoice'
import { defaultDueDate } from '@/lib/payments/format'

export type { ApplicationForInvoice }

export type CreateTuitionInvoiceInput = {
  applicationId: string
  adminId: string
  amountGhs?: number
  discountGhs?: number
  promoCodeId?: string | null
  dueDate?: string
  notes?: string
  allowInstallments?: boolean
  installmentCount?: number
}

export async function createTuitionInvoice(
  supabase: SupabaseClient,
  application: ApplicationForInvoice,
  input: CreateTuitionInvoiceInput,
): Promise<
  { invoiceId: string; reference: string; totalGhs: number; created: boolean } | { error: string }
> {
  const course = Array.isArray(application.courses)
    ? application.courses[0]
    : application.courses
  const defaultTuition = Number(course?.tuition_fee_ghs ?? 0)

  return createApplicationInvoice(supabase, application, {
    ...input,
    paymentTypeSlug: 'tuition',
    paymentTypeLabel: 'Tuition',
    amountGhs: input.amountGhs ?? defaultTuition,
    discountGhs: input.discountGhs ?? 0,
    dueDate: input.dueDate ?? defaultDueDate(14),
    notes: input.notes,
    allowInstallments: input.allowInstallments,
    installmentCount: input.installmentCount,
  })
}

export async function sendTuitionInvoiceNotifications(
  application: Pick<ApplicationForInvoice, 'real_email' | 'full_name' | 'phone' | 'country'>,
  reference: string,
  totalGhs: number,
  dueDate: string,
  invoiceId: string,
): Promise<void> {
  await sendApplicationInvoiceNotifications(
    application,
    reference,
    totalGhs,
    dueDate,
    invoiceId,
    'Tuition',
  )
}
