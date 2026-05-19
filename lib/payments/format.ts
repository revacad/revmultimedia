import { formatGHS } from '@/lib/utils'

export function formatPaymentDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatPaymentDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'paid' || status === 'waived') return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

export function sumInstallments(
  installments: { amount_ghs: number | string }[],
): number {
  return installments.reduce((sum, row) => sum + Number(row.amount_ghs), 0)
}

export function formatAmountGhs(amount: number): string {
  return formatGHS(amount)
}

export function defaultDueDate(daysFromNow = 14): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}
