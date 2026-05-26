import { getInvoiceBalance, roundGhs } from '@/lib/payments/balance'

const AMOUNT_TOLERANCE_GHS = 0.02

export type ManualPaymentGuardInput = {
  status: string
  total_ghs: number
  payment_method: string | null
  paystack_reference: string | null
}

export function getEffectiveInvoiceBalance(
  invoice: ManualPaymentGuardInput,
  installments: { amount_ghs: number | string }[],
) {
  const balance = getInvoiceBalance(Number(invoice.total_ghs), installments)

  const settledOnlineWithoutInstallments =
    invoice.status === 'paid' &&
    invoice.payment_method === 'paystack' &&
    Boolean(invoice.paystack_reference) &&
    balance.paid === 0

  if (settledOnlineWithoutInstallments) {
    return {
      ...balance,
      paid: balance.total,
      remaining: 0,
      overpaid: 0,
      canRecordPayment: false,
    }
  }

  return balance
}

export function assertCanRecordManualPayment(
  invoice: ManualPaymentGuardInput,
  installments: { amount_ghs: number | string }[],
): { ok: true; remaining: number } | { ok: false; error: string } {
  if (invoice.status === 'waived') {
    return { ok: false, error: 'Invoice is waived' }
  }

  const balance = getEffectiveInvoiceBalance(invoice, installments)

  if (invoice.status === 'paid' || !balance.canRecordPayment) {
    return {
      ok: false,
      error: 'This invoice is already fully paid. No further payments can be recorded.',
    }
  }

  if (balance.overpaid > 0) {
    return {
      ok: false,
      error:
        'This invoice shows an overpayment. Resolve the balance before recording another payment.',
    }
  }

  return { ok: true, remaining: balance.remaining }
}

export function paystackAmountMatchesSettlement(
  amountPesewas: number | undefined,
  remainingGhs: number,
  options?: { requireFullAmount?: boolean; totalGhs?: number },
): { ok: true; amountGhs: number } | { ok: false; reason: string } {
  if (amountPesewas == null || !Number.isFinite(amountPesewas) || amountPesewas <= 0) {
    return { ok: false, reason: 'missing_or_invalid_amount' }
  }

  const amountGhs = roundGhs(amountPesewas / 100)
  const remaining = roundGhs(remainingGhs)

  if (options?.requireFullAmount && options.totalGhs != null) {
    const total = roundGhs(options.totalGhs)
    if (amountGhs + AMOUNT_TOLERANCE_GHS < total) {
      return { ok: false, reason: 'application_fee_underpaid' }
    }
  }

  if (amountGhs + AMOUNT_TOLERANCE_GHS < remaining) {
    return { ok: false, reason: 'amount_less_than_remaining' }
  }

  return { ok: true, amountGhs }
}

export function isDuplicatePaystackReference(
  existingReference: string | null,
  incomingReference: string,
): boolean {
  return Boolean(existingReference && existingReference === incomingReference)
}
