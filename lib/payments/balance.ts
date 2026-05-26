import { sumInstallments } from '@/lib/payments/format'

export function roundGhs(amount: number): number {
  return Math.round(amount * 100) / 100
}

export function getInvoiceBalance(
  totalGhs: number,
  installments: { amount_ghs: number | string }[],
) {
  const total = roundGhs(totalGhs)
  const paid = roundGhs(sumInstallments(installments))
  const remaining = roundGhs(Math.max(0, total - paid))
  const overpaid = roundGhs(Math.max(0, paid - total))
  const canRecordPayment = remaining > 0

  return { total, paid, remaining, overpaid, canRecordPayment }
}
