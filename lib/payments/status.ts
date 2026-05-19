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
  other: 'Other',
}
