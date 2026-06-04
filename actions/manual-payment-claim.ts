'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireFinanceAccess } from '@/lib/auth/admin'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import { getInvoiceIfOwnedByUser } from '@/lib/portal/verify-invoice-access'
import { confirmPayment } from '@/actions/payment'
import {
  sendManualPaymentClaimEmail,
  sendManualPaymentClaimRejectedEmail,
} from '@/lib/notifications/email'
import { sendMessage } from '@/lib/notifications/sms'
import { getSystemSettings } from '@/lib/settings/cache'
import { accountsWhatsAppWaMePath } from '@/lib/settings/accounts-whatsapp'
import { isPaystackEnabled } from '@/lib/settings/paystack-enabled'
import { roundGhs } from '@/lib/payments/balance'
import { sumInstallments } from '@/lib/payments/format'
import { safeActionError } from '@/lib/errors/action'
import {
  manualPaymentClaimIdSchema,
  submitManualPaymentClaimSchema,
} from '@/lib/validations/manual-payment-claim'

export async function submitManualPaymentClaim(
  invoiceId: string,
  transactionRef: string,
): Promise<{ success: true; message: string } | { error: string }> {
  try {
    const user = await requirePortalUser()
    const parsed = submitManualPaymentClaimSchema.safeParse({ invoiceId, transactionRef })
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid submission' }
    }

    const supabase = createAdminClient()
    const invoice = await getInvoiceIfOwnedByUser(supabase, user.id, parsed.data.invoiceId)
    if (!invoice) {
      return { error: 'Invoice not found' }
    }
    if (invoice.type !== 'application_fee') {
      return { error: 'Manual payment claims are only available for application fees' }
    }

    const settings = await getSystemSettings()
    if (isPaystackEnabled(settings)) {
      return {
        error:
          'Application fees must be paid online via Paystack. If you cannot pay online, contact our accounts team on WhatsApp.',
      }
    }

    if (invoice.status === 'paid' || invoice.status === 'waived') {
      return { error: 'This invoice is already settled' }
    }

    const { data: existingClaim } = await supabase
      .from('manual_payment_claims')
      .select('id')
      .eq('invoice_id', parsed.data.invoiceId)
      .eq('student_auth_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingClaim) {
      return {
        error:
          'You already have a pending payment claim for this invoice. Our team will review it shortly.',
      }
    }

    const { error: insertError } = await supabase.from('manual_payment_claims').insert({
      invoice_id: parsed.data.invoiceId,
      student_auth_user_id: user.id,
      transaction_ref: parsed.data.transactionRef,
      status: 'pending',
    })

    if (insertError) {
      return safeActionError(
        'manual-payment-claim.submit',
        insertError,
        'Could not submit your payment claim. Please try again.',
      )
    }

    const { data: application } = await supabase
      .from('applications')
      .select('real_email, full_name')
      .eq('id', invoice.application_id)
      .maybeSingle()

    if (application?.real_email) {
      void sendManualPaymentClaimEmail(application.real_email, {
        name: application.full_name ?? 'Student',
        invoiceReference: invoice.reference,
        transactionRef: parsed.data.transactionRef,
        amountGhs: roundGhs(invoice.total_ghs),
      })
    }

    const academyPhone = settings.academy_phone?.trim()
    if (academyPhone) {
      void sendMessage(
        academyPhone,
        `Rev Multimedia Admin: Manual payment claim for invoice ${invoice.reference}. Student ref: ${parsed.data.transactionRef}. Review in Admin > Payments > Payment Claims.`,
        'whatsapp',
      ).catch(() =>
        sendMessage(
          academyPhone,
          `Rev Multimedia Admin: Manual payment claim for invoice ${invoice.reference}. Student ref: ${parsed.data.transactionRef}. Review in Admin > Payments > Payment Claims.`,
          'sms',
        ),
      )
    }

    revalidatePath('/admin/payments')
    revalidatePath('/admin')
    revalidatePath('/portal/invoices')
    return {
      success: true,
      message:
        'Thank you. Your payment claim has been submitted. Our team will verify and confirm within 24 hours.',
    }
  } catch (error) {
    return safeActionError(
      'manual-payment-claim.submit',
      error,
      'Could not submit your payment claim. Please try again.',
    )
  }
}

export async function confirmManualPaymentClaim(
  claimId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    await requireFinanceAccess()
    const parsed = manualPaymentClaimIdSchema.safeParse({ claimId })
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid claim' }
    }

    const supabase = createAdminClient()
    const { data: claim, error: claimError } = await supabase
      .from('manual_payment_claims')
      .select(
        `
        id,
        invoice_id,
        transaction_ref,
        status,
        invoices(
          id,
          reference,
          total_ghs,
          status,
          installments(amount_ghs)
        )
      `,
      )
      .eq('id', parsed.data.claimId)
      .maybeSingle()

    if (claimError || !claim) {
      return { error: 'Claim not found' }
    }
    if (claim.status !== 'pending') {
      return { error: 'This claim has already been processed' }
    }

    const invoiceRaw = claim.invoices
    const invoice = Array.isArray(invoiceRaw) ? invoiceRaw[0] : invoiceRaw
    if (!invoice) {
      return { error: 'Invoice not found' }
    }

    const totalGhs = roundGhs(Number(invoice.total_ghs))
    const paidGhs = roundGhs(
      sumInstallments(
        (invoice.installments as { amount_ghs: number }[] | null) ?? [],
      ),
    )
    const remainingGhs = roundGhs(Math.max(0, totalGhs - paidGhs))

    if (remainingGhs <= 0 || invoice.status === 'paid' || invoice.status === 'waived') {
      await supabase.from('manual_payment_claims').delete().eq('id', claim.id)
      return { error: 'This invoice is already fully paid' }
    }

    const paymentResult = await confirmPayment({
      invoiceId: invoice.id,
      amountGhs: remainingGhs,
      paymentMethod: 'momo',
      transactionRef: claim.transaction_ref,
      paymentNote: 'Confirmed from manual payment claim',
      paidAt: new Date().toISOString(),
    })

    if ('error' in paymentResult) {
      return { error: paymentResult.error }
    }

    await supabase
      .from('manual_payment_claims')
      .update({ status: 'verified' })
      .eq('id', claim.id)

    revalidatePath('/admin/payments')
    revalidatePath('/admin')
    revalidatePath('/portal/invoices')
    return { success: true }
  } catch (error) {
    return safeActionError(
      'manual-payment-claim.confirm',
      error,
      'Could not confirm payment claim.',
    )
  }
}

export async function rejectManualPaymentClaim(
  claimId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    await requireFinanceAccess()
    const parsed = manualPaymentClaimIdSchema.safeParse({ claimId })
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid claim' }
    }

    const supabase = createAdminClient()
    const { data: claim, error: claimError } = await supabase
      .from('manual_payment_claims')
      .select(
        `
        id,
        status,
        transaction_ref,
        student_auth_user_id,
        invoices(reference, applications(full_name, phone, real_email))
      `,
      )
      .eq('id', parsed.data.claimId)
      .maybeSingle()

    if (claimError || !claim) {
      return { error: 'Claim not found' }
    }
    if (claim.status !== 'pending') {
      return { error: 'This claim has already been processed' }
    }

    const transactionRef = claim.transaction_ref as string

    const invoiceRaw = claim.invoices
    const invoice = Array.isArray(invoiceRaw) ? invoiceRaw[0] : invoiceRaw
    const applicationRaw = invoice?.applications
    const application = Array.isArray(applicationRaw) ? applicationRaw[0] : applicationRaw

    const { error: deleteError } = await supabase
      .from('manual_payment_claims')
      .delete()
      .eq('id', claim.id)

    if (deleteError) {
      return safeActionError(
        'manual-payment-claim.reject',
        deleteError,
        'Could not reject payment claim.',
      )
    }

    const phone = application?.phone?.trim()
    const email = application?.real_email?.trim()
    const invoiceRef = invoice?.reference ?? 'your invoice'
    const studentName = application?.full_name ?? 'Student'
    const rejectSettings = await getSystemSettings()
    const waPath = accountsWhatsAppWaMePath(rejectSettings.accounts_whatsapp_number)
    const waSuffix = waPath ? ` Please contact us on WhatsApp: ${waPath}` : ''
    const notifyMessage = `Rev Multimedia: Your payment claim for invoice ${invoiceRef} could not be verified.${waSuffix}`

    if (email) {
      void sendManualPaymentClaimRejectedEmail(email, {
        name: studentName,
        invoiceReference: invoiceRef,
        transactionRef,
      })
    }

    if (phone) {
      void sendMessage(phone, notifyMessage, 'sms')
    }

    revalidatePath('/admin/payments')
    revalidatePath('/admin')
    revalidatePath('/portal/invoices')
    return { success: true }
  } catch (error) {
    return safeActionError(
      'manual-payment-claim.reject',
      error,
      'Could not reject payment claim.',
    )
  }
}
