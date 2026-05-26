import type { SupabaseClient } from '@supabase/supabase-js'
import { getInvoiceBalance, roundGhs } from '@/lib/payments/balance'
import {
  isDuplicatePaystackReference,
  paystackAmountMatchesSettlement,
} from '@/lib/payments/guards'

const TOLERANCE = 0.02
import { markApplicationFeePaid, markNonTuitionInvoicePaid } from '@/lib/payments/settle-invoice'

export type PaystackSettleInvoice = {
  id: string
  reference: string
  type: string
  status: string
  application_id: string | null
  total_ghs: number
  paystack_reference: string | null
}

export async function settlePaystackCharge(
  supabase: SupabaseClient,
  invoice: PaystackSettleInvoice,
  paystackReference: string,
  amountPesewas: number | undefined,
  paidAt: string,
): Promise<
  | { settled: true; invoiceType: string; applicationId: string | null }
  | { settled: false; reason: string }
> {
  if (invoice.status === 'paid' || invoice.status === 'waived') {
    return { settled: false, reason: 'already_settled' }
  }

  if (isDuplicatePaystackReference(invoice.paystack_reference, paystackReference)) {
    return { settled: false, reason: 'duplicate_reference' }
  }

  const { data: installments } = await supabase
    .from('installments')
    .select('amount_ghs')
    .eq('invoice_id', invoice.id)

  const { remaining } = getInvoiceBalance(
    Number(invoice.total_ghs),
    installments ?? [],
  )

  if (remaining <= 0) {
    return { settled: false, reason: 'nothing_remaining' }
  }

  const totalGhs = roundGhs(Number(invoice.total_ghs))
  const amountCheck = paystackAmountMatchesSettlement(amountPesewas, remaining, {
    requireFullAmount:
      invoice.type === 'application_fee' && remaining >= totalGhs - TOLERANCE,
    totalGhs,
  })

  if (!amountCheck.ok) {
    return { settled: false, reason: amountCheck.reason }
  }

  if (invoice.type === 'application_fee' && invoice.application_id) {
    const { error } = await markApplicationFeePaid(
      supabase,
      invoice.id,
      invoice.application_id,
      'paystack',
      { paystackReference },
    )
    if (error) {
      return { settled: false, reason: error }
    }
  } else {
    const { error } = await markNonTuitionInvoicePaid(supabase, invoice.id, 'paystack', {
      paystackReference,
    })
    if (error) {
      return { settled: false, reason: error }
    }
  }

  return {
    settled: true,
    invoiceType: invoice.type,
    applicationId: invoice.application_id,
  }
}
