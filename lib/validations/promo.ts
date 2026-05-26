import { z } from 'zod'

const promoCodePattern = /^[A-Z0-9][A-Z0-9_-]{1,31}$/

const optionalExpiresAt = z.preprocess(
  (val) => (val === '' || val == null ? null : val),
  z
    .union([z.string().min(1), z.null()])
    .optional()
    .refine(
      (value) => {
        if (value == null) return true
        const d = new Date(value)
        return !Number.isNaN(d.getTime())
      },
      { message: 'Invalid expiry date' },
    ),
)

export const createPromoCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'Code must be at least 2 characters')
      .max(32)
      .transform((s) => s.toUpperCase())
      .refine((s) => promoCodePattern.test(s), {
        message: 'Code may only use letters, numbers, hyphens, and underscores',
      }),
    discountType: z.enum(['percentage', 'flat_ghs']),
    discountValue: z.coerce.number().positive('Discount value must be greater than zero'),
    maxUses: z.coerce.number().int().positive().nullable().optional(),
    expiresAt: optionalExpiresAt,
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      ctx.addIssue({
        code: 'custom',
        message: 'Percentage discount cannot exceed 100',
        path: ['discountValue'],
      })
    }
    if (data.discountType === 'flat_ghs' && data.discountValue > 1_000_000) {
      ctx.addIssue({
        code: 'custom',
        message: 'Flat discount is too large',
        path: ['discountValue'],
      })
    }
  })

export const setPromoCodeActiveSchema = z.object({
  promoId: z.uuid(),
  isActive: z.boolean(),
})
