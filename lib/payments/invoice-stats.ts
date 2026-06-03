import { roundGhs } from '@/lib/payments/balance'
import { getEffectiveInvoiceBalance } from '@/lib/payments/guards'

export type InvoiceForStats = {
  status: string
  type?: string
  total_ghs: number
  payment_method?: string | null
  paystack_reference?: string | null
  updated_at?: string
  installments?: { amount_ghs: number | string; paid_at?: string }[]
}

export function getInvoicePaidAndRemaining(invoice: InvoiceForStats) {
  return getEffectiveInvoiceBalance(
    {
      status: invoice.status,
      total_ghs: Number(invoice.total_ghs),
      payment_method: invoice.payment_method ?? null,
      paystack_reference: invoice.paystack_reference ?? null,
    },
    invoice.installments ?? [],
  )
}

export type PaymentAggregateStats = {
  totalCollected: number
  outstanding: number
  paidThisMonth: number
  pendingCount: number
}

export function aggregatePaymentStats(
  invoices: InvoiceForStats[],
  options?: { tuitionOnlyOutstanding?: boolean },
): PaymentAggregateStats {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let totalCollected = 0
  let outstanding = 0
  let paidThisMonth = 0
  let pendingCount = 0

  for (const inv of invoices) {
    const { paid, remaining } = getInvoicePaidAndRemaining(inv)
    totalCollected += paid

    const installments = inv.installments ?? []
    for (const row of installments) {
      if (row.paid_at && new Date(row.paid_at) >= monthStart) {
        paidThisMonth += Number(row.amount_ghs)
      }
    }

    if (
      inv.status === 'paid' &&
      installments.length === 0 &&
      inv.updated_at &&
      new Date(inv.updated_at) >= monthStart
    ) {
      paidThisMonth += Math.min(paid, Number(inv.total_ghs))
    }

    if (inv.status === 'unpaid' || inv.status === 'partially_paid') {
      if (!options?.tuitionOnlyOutstanding || inv.type === 'tuition') {
        outstanding += remaining
      }
      pendingCount += 1
    }
  }

  return {
    totalCollected: roundGhs(totalCollected),
    outstanding: roundGhs(outstanding),
    paidThisMonth: roundGhs(paidThisMonth),
    pendingCount,
  }
}
