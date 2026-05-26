import { z } from 'zod'

export const PAYMENT_METHODS = [
  'momo',
  'bank_transfer',
  'international_wire',
  'cash',
  'paystack',
  'other',
] as const

export const confirmPaymentSchema = z.object({
  invoiceId: z.uuid(),
  amountGhs: z.coerce
    .number()
    .positive('Amount must be greater than zero')
    .max(10_000_000, 'Amount is too large'),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    message: 'Invalid payment method',
  }),
  transactionRef: z
    .string()
    .trim()
    .max(100, 'Reference is too long')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  paymentNote: z
    .string()
    .trim()
    .max(500, 'Note is too long')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  paidAt: z.coerce.date({ message: 'Invalid payment date' }),
})

export const waiveInvoiceSchema = z.object({
  invoiceId: z.uuid('Invalid invoice id'),
})

export const resendInvoiceEmailSchema = waiveInvoiceSchema
