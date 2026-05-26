export const INVOICE_STATUSES = [
  'unpaid',
  'partially_paid',
  'paid',
  'waived',
] as const

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export type InvoiceType = 'application_fee' | 'tuition'

export type PaymentListRow = {
  id: string
  reference: string
  type: string
  payment_type_label: string | null
  amount_ghs: number
  discount_ghs: number
  total_ghs: number
  due_date: string | null
  status: InvoiceStatus
  payment_method: string | null
  created_at: string
  updated_at: string
  applications: {
    id: string
    reference: string
    full_name: string
    real_email: string
    country: string
  } | null
  installments: { amount_ghs: number }[]
  admins: { full_name: string } | null
}

export type InstallmentRow = {
  id: string
  amount_ghs: number
  payment_method: string
  transaction_ref: string | null
  payment_note: string | null
  paid_at: string
  admins: { full_name: string } | null
}

export type PaymentTypeInfo = {
  id: string
  slug: string
  label: string
  description: string | null
}

export type InvoiceDetail = {
  id: string
  reference: string
  type: string
  payment_type: PaymentTypeInfo | null
  amount_ghs: number
  discount_ghs: number
  total_ghs: number
  due_date: string | null
  status: InvoiceStatus
  payment_method: string | null
  paystack_reference: string | null
  discount_note: string | null
  created_at: string
  updated_at: string
  application_id: string
  promo_codes: {
    code: string
    discount_type: string
    discount_value: number
  } | null
  applications: {
    id: string
    reference: string
    full_name: string
    real_email: string
    phone: string
    country: string
    courses: { title: string } | null
    intakes: { name: string; start_date: string } | null
  } | null
  installments: InstallmentRow[]
  admins: { full_name: string } | null
}
