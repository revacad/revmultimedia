'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { sendPaymentConfirmed, sendTuitionInvoice, sendAppFeeInvoice } from '@/lib/notifications/email'
import { sendMessage } from '@/lib/notifications/sms'
import { invalidateAdminStats } from '@/lib/redis/invalidate'
import { runAfterResponse } from '@/lib/background'
import { logAuditEvent } from '@/lib/audit/log'

const PAYMENT_METHODS = [
  'momo',
  'bank_transfer',
  'international_wire',
  'cash',
  'paystack',
  'other',
] as const

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
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    if (!admin) {
      return { error: 'Not an admin' }
    }

    if (!PAYMENT_METHODS.includes(data.paymentMethod as (typeof PAYMENT_METHODS)[number])) {
      return { error: 'Invalid payment method' }
    }

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, applications(id, real_email, full_name, phone, country, courses(title))')
      .eq('id', data.invoiceId)
      .single()

    if (!invoice) {
      return { error: 'Invoice not found' }
    }

    if (invoice.status === 'waived' || invoice.status === 'paid') {
      return { error: 'Invoice is already closed' }
    }

    const { error: installmentError } = await supabase.from('installments').insert({
      invoice_id: data.invoiceId,
      amount_ghs: data.amountGhs,
      payment_method: data.paymentMethod,
      transaction_ref: data.transactionRef || null,
      payment_note: data.paymentNote || null,
      confirmed_by_admin_id: admin.id,
      paid_at: data.paidAt,
    })

    if (installmentError) {
      return { error: installmentError.message }
    }

    const { data: installments } = await supabase
      .from('installments')
      .select('amount_ghs')
      .eq('invoice_id', data.invoiceId)

    const totalPaid =
      installments?.reduce((sum, inst) => sum + Number(inst.amount_ghs), 0) ?? 0
    const isFullyPaid = totalPaid >= Number(invoice.total_ghs)

    if (isFullyPaid) {
      const { data: result, error } = await supabase.rpc('confirm_full_payment', {
        p_invoice_id: data.invoiceId,
        p_admin_id: admin.id,
        p_payment_method: data.paymentMethod,
        p_transaction_note: data.paymentNote || '',
      })

      if (error) {
        console.error('confirm_full_payment error:', error)
        return { error: 'Failed to confirm full payment' }
      }

      const rpc = result as { student_id?: string; error?: string } | null

      if (rpc?.error) {
        console.error('confirm_full_payment returned:', rpc)
        return {
          error:
            rpc.error === 'auth_user_id is null on application'
              ? 'This application has no linked auth account. The applicant must complete registration before full payment can create a student record.'
              : rpc.error,
        }
      }
      const application = invoice.applications as {
        real_email: string
        full_name: string
        phone: string
        courses: { title: string } | { title: string }[] | null
      } | null

      const studentId = rpc?.student_id

      await logAuditEvent({
        adminId: admin.id,
        action: 'payment.confirmed',
        entityType: 'invoice',
        entityId: data.invoiceId,
        newValue: {
          amount: data.amountGhs,
          method: data.paymentMethod,
          studentId,
        },
      })

      runAfterResponse(async () => {
        if (application) {
          const courseTitle = Array.isArray(application.courses)
            ? application.courses[0]?.title
            : application.courses?.title

          await Promise.allSettled([
            sendPaymentConfirmed(application.real_email, {
              name: application.full_name,
              studentId: studentId,
              courseName: courseTitle ?? '',
            }),
            sendMessage(
              application.phone,
              studentId
                ? `Rev Multimedia: Payment confirmed! Your Student ID is ${studentId}. Welcome to Rev Multimedia! Log in at revmultimedia.com`
                : `Rev Multimedia: Payment of GHS ${data.amountGhs.toFixed(2)} confirmed for invoice ${data.invoiceId}.`,
              'sms',
            ),
          ])
        }
      })

      invalidateAdminStats()
      revalidatePath(`/admin/payments/${data.invoiceId}`)
      revalidatePath('/admin/payments')
      return { success: true, fullyPaid: true, studentId: rpc?.student_id }
    }

    await supabase
      .from('invoices')
      .update({ status: 'partially_paid', updated_at: new Date().toISOString() })
      .eq('id', data.invoiceId)

    invalidateAdminStats()
    revalidatePath(`/admin/payments/${data.invoiceId}`)
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
    await requireAdmin()
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'waived', updated_at: new Date().toISOString() })
      .eq('id', invoiceId)

    if (error) {
      return { error: error.message }
    }

    invalidateAdminStats()
    revalidatePath(`/admin/payments/${invoiceId}`)
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
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, applications(real_email, full_name, phone, country)')
      .eq('id', invoiceId)
      .single()

    if (!invoice) {
      return { error: 'Invoice not found' }
    }

    const application = invoice.applications as {
      real_email: string
      full_name: string
      country: string
    }

    const { data: settings } = await supabase.from('system_settings').select('key, value')
    const settingsMap = Object.fromEntries(
      (settings ?? []).map((s) => [s.key, s.value ?? '']),
    )

    if (invoice.type === 'tuition') {
      await sendTuitionInvoice(application.real_email, {
        name: application.full_name,
        reference: invoice.reference,
        amountGhs: Number(invoice.total_ghs),
        dueDate: invoice.due_date ?? '',
        isInternational: application.country !== 'Ghana',
        momoNumber: settingsMap.momo_number_1 || undefined,
        momoName: settingsMap.momo_name_1 || undefined,
        bankName: settingsMap.bank_name || undefined,
        bankAccount: settingsMap.bank_account_number || undefined,
        bankAccountName: settingsMap.bank_account_name || undefined,
        swiftCode: settingsMap.bank_swift_code || undefined,
        pdfUrl: '',
      })
    } else {
      await sendAppFeeInvoice(application.real_email, {
        name: application.full_name,
        reference: invoice.reference,
        amountGhs: Number(invoice.total_ghs),
        paystackLink: '',
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
