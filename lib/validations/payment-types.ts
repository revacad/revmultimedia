import { z } from 'zod'

const paymentTypeSlugPattern = /^[a-z][a-z0-9_]{1,63}$/

export const paymentTypeSlugSchema = z
  .string()
  .trim()
  .min(2, 'Slug must be at least 2 characters')
  .max(64)
  .transform((s) => s.toLowerCase().replace(/\s+/g, '_'))
  .refine((s) => paymentTypeSlugPattern.test(s), {
    message: 'Slug must start with a letter and use only lowercase letters, numbers, and underscores',
  })

export const createPaymentTypeSchema = z.object({
  slug: paymentTypeSlugSchema,
  label: z.string().trim().min(2, 'Label is required').max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((s) => (s === '' ? undefined : s)),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
})

export const updatePaymentTypeSchema = z.object({
  id: z.uuid(),
  label: z.string().trim().min(2, 'Label is required').max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((s) => (s === '' ? null : s ?? null)),
  sortOrder: z.coerce.number().int().min(0).max(999),
  allowPaystack: z.boolean().optional(),
})

export const setPaymentTypeActiveSchema = z.object({
  id: z.uuid(),
  isActive: z.boolean(),
})
