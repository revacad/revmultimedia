import type { InvoiceStatus } from '@/lib/payments/types'

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  waived: 'Waived',
}

export const INVOICE_STATUS_CLASS: Record<InvoiceStatus, string> = {
  unpaid: 'bg-[#FDECEC] text-[#E84A4A]',
  partially_paid: 'bg-[#FEF6EE] text-[#C4701E]',
  paid: 'bg-[#EBF9F8] text-[#1E9990]',
  waived: 'bg-[#F0F0F8] text-[#9898B8]',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  momo: 'MoMo',
  bank_transfer: 'Bank Transfer',
  international_wire: 'International Wire',
  cash: 'Cash',
  paystack: 'Paystack',
  other: 'Manual',
}

/** Badge label + Tailwind classes for invoice payment method display */
export const PAYMENT_METHOD_BADGE_LABELS: Record<string, string> = {
  paystack: 'Paystack',
  momo: 'MoMo',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  other: 'Manual',
  international_wire: 'International Wire',
}

export const PAYMENT_METHOD_BADGE_CLASS: Record<string, string> = {
  paystack: 'bg-[#EBF9F8] text-[#1E9990]',
  momo: 'bg-[#EBF0FD] text-[#4A7BE8]',
  bank_transfer: 'bg-[#EBF0FD] text-[#4A7BE8]',
  international_wire: 'bg-[#EBF0FD] text-[#4A7BE8]',
  cash: 'bg-[#F0F0F8] text-[#5A5A7A]',
  other: 'bg-[#F0F0F8] text-[#5A5A7A]',
}

const PAYMENT_METHOD_BADGE_FALLBACK_CLASS = 'bg-[#F0F0F8] text-[#5A5A7A]'

export function paymentMethodBadgeClass(method: string): string {
  return PAYMENT_METHOD_BADGE_CLASS[method] ?? PAYMENT_METHOD_BADGE_FALLBACK_CLASS
}

export function paymentMethodBadgeLabel(method: string): string {
  return PAYMENT_METHOD_BADGE_LABELS[method] ?? PAYMENT_METHOD_LABELS[method] ?? method
}
