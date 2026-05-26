'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { generateAndStoreInvoicePdf } from '@/lib/pdf/generate'
import { generatePresignedDownloadUrl } from '@/lib/r2/presign'
import {
  sendPaymentConfirmed,
  sendAppFeeInvoice,
  sendInvoiceReadyEmail,
} from '@/lib/notifications/email'
import { sendPaymentReceiptNotification } from '@/lib/notifications/payment-receipt'
import { paymentTypeLabelFromSlug } from '@/lib/payments/payment-types'
import { sendMessage } from '@/lib/notifications/sms'
import { invalidateAdminStats } from '@/lib/redis/invalidate'
import { runAfterResponse } from '@/lib/background'
import { logAuditEvent } from '@/lib/audit/log'
import { roundGhs } from '@/lib/payments/balance'
import { assertCanRecordManualPayment } from '@/lib/payments/guards'
import {
  markApplicationFeePaid,
  markNonTuitionInvoicePaid,
} from '@/lib/payments/settle-invoice'
import { formatAmountGhs, sumInstallments } from '@/lib/payments/format'
import {
  confirmPaymentSchema,
  resendInvoiceEmailSchema,
  waiveInvoiceSchema,
} from '@/lib/validations/payment'

export async function confirmPayment(data: {
  invoiceId: string
  amountGhs: number
  paymentMethod: string
  transactionRef?: string
  paymentNote?: string
  paidAt: string
}): Promise<
  | { success: true; fullyPaid: boolean; studentId?: string }
  | { error: string }
> {
  try {
    const parsed = confirmPaymentSchema.safeParse(data)
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid payment details',
      }
    }

    const session = await requireAdmin()
    const supabase = createAdminClient()
    const payload = parsed.data

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    if (!admin) {
      return { error: 'Not an admin' }
    }

    const { data: invoice } = await supabase
      .from('invoices')
      .select(
        '*, payment_types(label), applications(id, real_email, full_name, phone, country, courses(title))',
      )
      .eq('id', payload.invoiceId)
      .single()

    if (!invoice) {
      return { error: 'Invoice not found' }
    }

    const { data: existingInstallments } = await supabase
      .from('installments')
      .select('amount_ghs, transaction_ref')
      .eq('invoice_id', payload.invoiceId)

    const manualGuard = assertCanRecordManualPayment(
      {
        status: invoice.status,
        total_ghs: Number(invoice.total_ghs),
        payment_method: invoice.payment_method as string | null,
        paystack_reference: (invoice.paystack_reference as string | null) ?? null,
      },
      existingInstallments ?? [],
    )

    if (!manualGuard.ok) {
      return { error: manualGuard.error }
    }

    const remaining = manualGuard.remaining

    if (payload.transactionRef) {
      const duplicateRef = (existingInstallments ?? []).some(
        (row) =>
          row.transaction_ref &&
          row.transaction_ref.toLowerCase() === payload.transactionRef!.toLowerCase(),
      )
      if (duplicateRef) {
        return {
          error: 'This transaction reference was already recorded on this invoice.',
        }
      }
    }

    const amountGhs = roundGhs(payload.amountGhs)
    if (amountGhs > remaining) {
      return {
        error: `Amount exceeds remaining balance of ${formatAmountGhs(remaining)}.`,
      }
    }

    const paidAtIso = payload.paidAt.toISOString()

    const { data: installment, error: installmentError } = await supabase
      .from('installments')
      .insert({
        invoice_id: payload.invoiceId,
        amount_ghs: amountGhs,
        payment_method: payload.paymentMethod,
        transaction_ref: payload.transactionRef ?? null,
        payment_note: payload.paymentNote ?? null,
        confirmed_by_admin_id: admin.id,
        paid_at: paidAtIso,
      })
      .select('id')
      .single()

    if (installmentError || !installment) {
      return { error: installmentError?.message ?? 'Failed to record payment' }
    }

    const totalPaid = roundGhs(
      sumInstallments(existingInstallments ?? []) + amountGhs,
    )
    const isFullyPaid = totalPaid >= roundGhs(Number(invoice.total_ghs))

    const { data: freshInvoice } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', payload.invoiceId)
      .single()

    if (freshInvoice?.status === 'paid' || freshInvoice?.status === 'waived') {
      await supabase.from('installments').delete().eq('id', installment.id)
      return {
        error:
          'This invoice was settled while you were recording payment. Refresh the page and try again.',
      }
    }

    if (isFullyPaid) {
      const application = invoice.applications as {
        real_email: string
        full_name: string
        phone: string
        courses: { title: string } | { title: string }[] | null
      } | null

      let studentId: string | undefined

      if (invoice.type === 'tuition') {
        const { data: result, error } = await supabase.rpc('confirm_full_payment', {
          p_invoice_id: payload.invoiceId,
          p_admin_id: admin.id,
          p_payment_method: payload.paymentMethod,
          p_transaction_note: payload.paymentNote ?? '',
        })

        if (error) {
          console.error('confirm_full_payment error:', error)
          await supabase.from('installments').delete().eq('id', installment.id)
          return { error: 'Failed to confirm full payment' }
        }

        const rpc = result as { student_id?: string; error?: string } | null

        if (rpc?.error) {
          console.error('confirm_full_payment returned:', rpc)
          await supabase.from('installments').delete().eq('id', installment.id)
          return {
            error:
              rpc.error === 'auth_user_id is null on application'
                ? 'This application has no linked auth account. The applicant must complete registration before full payment can create a student record.'
                : rpc.error,
          }
        }

        studentId = rpc?.student_id
      } else if (invoice.type === 'application_fee') {
        const { error: settleError } = await markApplicationFeePaid(
          supabase,
          payload.invoiceId,
          invoice.application_id as string,
          payload.paymentMethod,
          { transactionNote: payload.paymentNote ?? undefined },
        )
        if (settleError) {
          await supabase.from('installments').delete().eq('id', installment.id)
          return { error: settleError }
        }
      } else {
        const { error: settleError } = await markNonTuitionInvoicePaid(
          supabase,
          payload.invoiceId,
          payload.paymentMethod,
          { transactionNote: payload.paymentNote ?? undefined },
        )
        if (settleError) {
          await supabase.from('installments').delete().eq('id', installment.id)
          return { error: settleError }
        }
      }

      await logAuditEvent({
        adminId: admin.id,
        action: 'payment.confirmed',
        entityType: 'invoice',
        entityId: payload.invoiceId,
        newValue: {
          amount: payload.amountGhs,
          method: payload.paymentMethod,
          studentId,
          invoiceType: invoice.type,
        },
      })

      runAfterResponse(async () => {
        if (application) {
          const courseTitle = Array.isArray(application.courses)
            ? application.courses[0]?.title
            : application.courses?.title

          await Promise.allSettled([
            sendPaymentReceiptNotification({
              invoiceId: payload.invoiceId,
              applicationId: invoice.application_id as string,
              installmentId: installment.id,
              amountPaidGhs: amountGhs,
              paymentMethod: payload.paymentMethod,
              transactionRef: payload.transactionRef,
              paidAt: paidAtIso,
              fullyPaid: true,
              totalPaidGhs: totalPaid,
              remainingGhs: 0,
            }),
            invoice.type === 'tuition' && studentId
              ? sendPaymentConfirmed(application.real_email, {
                  name: application.full_name,
                  studentId,
                  courseName: courseTitle ?? '',
                })
              : Promise.resolve(),
            invoice.type === 'tuition' && studentId
              ? sendMessage(
                  application.phone,
                  `Rev Multimedia: Payment confirmed! Your Student ID is ${studentId}. Welcome to Rev Multimedia! Log in at revmultimedia.com`,
                  'sms',
                )
              : Promise.resolve(),
          ])
        }
      })

      invalidateAdminStats()
      revalidatePath(`/admin/payments/${payload.invoiceId}`)
      revalidatePath('/admin/payments')
      return { success: true, fullyPaid: true, studentId }
    }

    await supabase
      .from('invoices')
      .update({ status: 'partially_paid', updated_at: new Date().toISOString() })
      .eq('id', payload.invoiceId)

    const applicationPartial = invoice.applications as {
      real_email: string
      full_name: string
      phone: string
    } | null

    runAfterResponse(async () => {
      if (applicationPartial) {
        await sendPaymentReceiptNotification({
          invoiceId: payload.invoiceId,
          applicationId: invoice.application_id as string,
          installmentId: installment.id,
          amountPaidGhs: amountGhs,
          paymentMethod: payload.paymentMethod,
          transactionRef: payload.transactionRef,
          paidAt: paidAtIso,
          fullyPaid: false,
          totalPaidGhs: totalPaid,
          remainingGhs: roundGhs(Number(invoice.total_ghs) - totalPaid),
        })
      }
    })

    invalidateAdminStats()
    revalidatePath(`/admin/payments/${payload.invoiceId}`)
    revalidatePath('/admin/payments')
    return { success: true, fullyPaid: false }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to confirm payment',
    }
  }
}

export async function waiveInvoice(
  invoiceId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const parsed = waiveInvoiceSchema.safeParse({ invoiceId })
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid invoice',
      }
    }

    await requireAdmin()
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'waived', updated_at: new Date().toISOString() })
      .eq('id', parsed.data.invoiceId)

    if (error) {
      return { error: error.message }
    }

    invalidateAdminStats()
    revalidatePath(`/admin/payments/${parsed.data.invoiceId}`)
    revalidatePath('/admin/payments')
    return { success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to waive invoice',
    }
  }
}

export async function resendInvoiceEmail(
  invoiceId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const parsed = resendInvoiceEmailSchema.safeParse({ invoiceId })
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid invoice id' }
    }

    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, payment_types(label), applications(real_email, full_name, phone, country)')
      .eq('id', parsed.data.invoiceId)
      .single()

    if (!invoice) {
      return { error: 'Invoice not found' }
    }

    const application = invoice.applications as {
      real_email: string
      full_name: string
      country: string
    }

    const paymentType = invoice.payment_types as { label: string } | { label: string }[] | null
    const paymentLabel = Array.isArray(paymentType)
      ? paymentType[0]?.label
      : paymentType?.label

    const { data: settings } = await supabase.from('system_settings').select('key, value')
    const settingsMap = Object.fromEntries(
      (settings ?? []).map((s) => [s.key, s.value ?? '']),
    )

    const pdfKey = await generateAndStoreInvoicePdf(parsed.data.invoiceId)
    let pdfUrl = ''
    const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
    if (pdfKey && bucket) {
      pdfUrl = await generatePresignedDownloadUrl(bucket, pdfKey, 86400)
    }

    if (invoice.type === 'application_fee') {
      await sendAppFeeInvoice(application.real_email, {
        name: application.full_name,
        reference: invoice.reference,
        amountGhs: Number(invoice.total_ghs),
        paystackLink: '',
      })
    } else {
      await sendInvoiceReadyEmail(application.real_email, {
        name: application.full_name,
        reference: invoice.reference,
        amountGhs: Number(invoice.total_ghs),
        dueDate: invoice.due_date ?? '',
        invoiceLabel: paymentLabel ?? paymentTypeLabelFromSlug(invoice.type),
        isInternational: application.country !== 'Ghana',
        momoNumber: settingsMap.momo_number_1 || undefined,
        momoName: settingsMap.momo_name_1 || undefined,
        bankName: settingsMap.bank_name || undefined,
        bankAccount: settingsMap.bank_account_number || undefined,
        bankAccountName: settingsMap.bank_account_name || undefined,
        swiftCode: settingsMap.bank_swift_code || undefined,
        pdfUrl: pdfUrl || undefined,
      })
    }

    if (admin) {
      await logAuditEvent({
        adminId: admin.id,
        action: 'invoice.email_resent',
        entityType: 'invoice',
        entityId: String(invoiceId),
        newValue: { resentAt: new Date().toISOString() },
      })
    }

    return { success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to resend email',
    }
  }
}
