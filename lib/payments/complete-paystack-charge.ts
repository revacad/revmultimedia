import type { SupabaseClient } from '@supabase/supabase-js'
import { logAuditEvent } from '@/lib/audit/log'
import { runAfterResponse } from '@/lib/background'
import { sendApplicationReceived } from '@/lib/notifications/email'
import { sendMessage } from '@/lib/notifications/sms'
import {
  canPaystackSettleInvoice,
  resolvePaystackInvoiceRef,
} from '@/lib/payments/paystack-invoice'
import { settlePaystackCharge, type PaystackSettleInvoice } from '@/lib/payments/paystack-settle'

export type CompletePaystackResult =
  | { ok: true; alreadyPaid: boolean; invoiceRef: string }
  | { ok: false; reason: string }

export async function completePaystackCharge(
  supabase: SupabaseClient,
  params: {
    paystackReference: string
    amountPesewas?: number
    metadata?: Record<string, unknown>
    paidAt?: string
    auditAdminId?: string | null
  },
): Promise<CompletePaystackResult> {
  const invoiceRef = resolvePaystackInvoiceRef(
    params.metadata,
    params.paystackReference,
  )

  if (!invoiceRef) {
    return { ok: false, reason: 'invalid_reference' }
  }

  const paidAt = params.paidAt ?? new Date().toISOString()

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(
      'id, reference, type, status, application_id, payment_type_id, total_ghs, paystack_reference',
    )
    .eq('reference', invoiceRef)
    .maybeSingle()

  if (invoiceError) {
    console.error('[paystack:complete] invoice lookup failed', invoiceError)
    return { ok: false, reason: 'lookup_failed' }
  }

  if (!invoice) {
    return { ok: false, reason: 'invoice_not_found' }
  }

  if (invoice.status === 'paid' || invoice.status === 'waived') {
    return { ok: true, alreadyPaid: true, invoiceRef: invoice.reference }
  }

  const canSettle = await canPaystackSettleInvoice(supabase, invoice)
  if (!canSettle) {
    return { ok: false, reason: 'not_eligible' }
  }

  const settlement = await settlePaystackCharge(
    supabase,
    invoice as PaystackSettleInvoice,
    params.paystackReference,
    params.amountPesewas,
    paidAt,
  )

  if (!settlement.settled) {
    if (
      settlement.reason === 'already_settled' ||
      settlement.reason === 'duplicate_reference'
    ) {
      return { ok: true, alreadyPaid: true, invoiceRef: invoice.reference }
    }
    console.warn('[paystack:complete] settlement skipped', {
      invoiceRef,
      reason: settlement.reason,
    })
    return { ok: false, reason: settlement.reason }
  }

  const applicationId = settlement.applicationId
  const totalGhs = Number(invoice.total_ghs)

  if (invoice.type === 'application_fee' && applicationId) {
    runAfterResponse(async () => {
      const { data: app } = await supabase
        .from('applications')
        .select('real_email, full_name, phone, reference')
        .eq('id', applicationId)
        .single()

      if (app) {
        const { sendPaymentReceiptNotification } = await import(
          '@/lib/notifications/payment-receipt'
        )

        await Promise.allSettled([
          sendApplicationReceived(app.real_email, {
            name: app.full_name,
            reference: app.reference,
          }),
          sendPaymentReceiptNotification({
            invoiceId: invoice.id,
            applicationId,
            amountPaidGhs: totalGhs,
            paymentMethod: 'paystack',
            transactionRef: params.paystackReference,
            paidAt,
            fullyPaid: true,
            totalPaidGhs: totalGhs,
            remainingGhs: 0,
          }),
          sendMessage(
            app.phone,
            `Rev Multimedia: Application fee received! Your application ${app.reference} is now under review. We'll update you soon.`,
            'sms',
          ),
        ])
      }
    })
  } else if (applicationId) {
    const invoiceId = invoice.id

    runAfterResponse(async () => {
      const { sendPaymentReceiptNotification } = await import(
        '@/lib/notifications/payment-receipt'
      )
      await sendPaymentReceiptNotification({
        invoiceId,
        applicationId,
        amountPaidGhs: totalGhs,
        paymentMethod: 'paystack',
        transactionRef: params.paystackReference,
        paidAt,
        fullyPaid: true,
        totalPaidGhs: totalGhs,
        remainingGhs: 0,
      })
    })
  }

  await logAuditEvent({
    adminId: params.auditAdminId ?? undefined,
    action: 'payment.paystack_completed',
    entityType: 'invoice',
    entityId: invoice.id,
    newValue: {
      invoiceRef: invoice.reference,
      paystackReference: params.paystackReference,
      type: invoice.type,
      applicationId,
    },
  })

  return { ok: true, alreadyPaid: false, invoiceRef: invoice.reference }
}
