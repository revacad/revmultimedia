import type { SupabaseClient } from '@supabase/supabase-js'
import { logAuditEvent } from '@/lib/audit/log'
import { runAfterResponse } from '@/lib/background'
import { deliverWhatsAppThenSms } from '@/lib/notifications/log-delivery'
import {
  canPaystackSettleInvoice,
  resolvePaystackInvoiceRef,
} from '@/lib/payments/paystack-invoice'
import { syncApplicationFeePaidFlag } from '@/lib/payments/settle-invoice'
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
    if (
      invoice.type === 'application_fee' &&
      invoice.application_id
    ) {
      const sync = await syncApplicationFeePaidFlag(
        supabase,
        invoice.application_id,
        invoice.id,
      )
      if (sync.error) {
        return { ok: false, reason: sync.error }
      }
    }
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
      if (
        invoice.type === 'application_fee' &&
        invoice.application_id
      ) {
        const sync = await syncApplicationFeePaidFlag(
          supabase,
          invoice.application_id,
          invoice.id,
        )
        if (sync.error) {
          return { ok: false, reason: sync.error }
        }
      }
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
          deliverWhatsAppThenSms({
            phone: app.phone,
            message: `Rev Multimedia: Application fee received! Your application ${app.reference} is now under review. We'll update you soon.`,
            applicationId,
            eventType: 'payment_confirmed',
            supabase,
          }),
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
    actorId: params.auditAdminId ?? null,
    actorType: params.auditAdminId ? 'admin' : null,
    action: 'payment_confirmed',
    targetType: 'invoice',
    targetId: invoice.id,
    metadata: {
      amount: totalGhs,
      method: 'paystack',
      invoiceRef: invoice.reference,
      paystackReference: params.paystackReference,
      type: invoice.type,
      applicationId,
    },
    newValue: {
      invoiceRef: invoice.reference,
      paystackReference: params.paystackReference,
      type: invoice.type,
      applicationId,
    },
  })

  return { ok: true, alreadyPaid: false, invoiceRef: invoice.reference }
}
