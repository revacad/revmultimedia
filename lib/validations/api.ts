import { z } from 'zod'
import { APPLICATION_DOCUMENT_TYPES } from '@/lib/security/files'
import { campaignFiltersSchema } from '@/lib/validations/communications'

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query is too long'),
})

export const messagingSendBodySchema = z.object({
  filters: campaignFiltersSchema,
})

export const otpSendBodySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(254)
    .email('Invalid email'),
  name: z
    .string()
    .trim()
    .max(200, 'Name is too long')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
})

export const otpVerifyBodySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(254)
    .email('Invalid email'),
  code: z
    .string()
    .trim()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must be 6 digits'),
})

export const r2ConfirmBodySchema = z.object({
  r2Key: z.string().trim().min(1).max(512),
  documentType: z.enum(APPLICATION_DOCUMENT_TYPES),
  draftId: z.uuid(),
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform((name) => name.split(/[/\\]/).pop()?.replace(/[^\w.\- ()]/g, '_').trim() || 'file'),
  fileSize: z.coerce.number().int().positive().max(25 * 1024 * 1024),
  mimeType: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9.+/-]+$/i, 'Invalid mime type'),
})
