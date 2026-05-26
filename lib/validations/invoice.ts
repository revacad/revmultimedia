import { z } from 'zod'

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T12:00:00.000Z`)
    return !Number.isNaN(parsed.getTime())
  }, 'Invalid due date')

/** Legacy snake_case shape (unused by current actions). */
export const generateInvoiceSchema = z.object({
  application_id: z.uuid(),
  amount_ghs: z.number().positive(),
  discount_ghs: z.number().nonnegative().default(0),
  promo_code: z.string().optional(),
  due_date: z.string().optional(),
  payment_method: z.enum([
    'paystack',
    'momo',
    'bank_transfer',
    'international_wire',
    'cash',
    'other',
  ]),
})

export const createApplicationInvoiceSchema = z
  .object({
    applicationId: z.uuid(),
    paymentTypeId: z.uuid(),
    amountGhs: z.coerce.number().positive('Amount must be greater than zero').max(10_000_000),
    discountGhs: z.coerce.number().nonnegative().max(10_000_000).default(0),
    promoCodeId: z.uuid().optional(),
    dueDate: dueDateSchema,
    allowInstallments: z.boolean().default(false),
    installmentCount: z.coerce.number().int().min(2).max(24).optional(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.discountGhs > data.amountGhs) {
      ctx.addIssue({
        code: 'custom',
        message: 'Discount cannot exceed amount',
        path: ['discountGhs'],
      })
    }
    if (data.allowInstallments && data.installmentCount != null && data.installmentCount < 2) {
      ctx.addIssue({
        code: 'custom',
        message: 'Installment count must be at least 2',
        path: ['installmentCount'],
      })
    }
  })

export const generateTuitionInvoiceSchema = z
  .object({
    applicationId: z.uuid(),
    amountGhs: z.coerce.number().positive('Amount must be greater than zero').max(10_000_000),
    discountGhs: z.coerce.number().nonnegative().max(10_000_000).default(0),
    promoCodeId: z.uuid().optional(),
    dueDate: dueDateSchema,
    allowInstallments: z.boolean(),
    installmentCount: z.coerce.number().int().min(2).max(24).optional(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.discountGhs > data.amountGhs) {
      ctx.addIssue({
        code: 'custom',
        message: 'Discount cannot exceed tuition amount',
        path: ['discountGhs'],
      })
    }
    if (data.allowInstallments && data.installmentCount != null && data.installmentCount < 2) {
      ctx.addIssue({
        code: 'custom',
        message: 'Installment count must be at least 2',
        path: ['installmentCount'],
      })
    }
  })
