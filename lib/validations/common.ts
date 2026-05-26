import { z } from 'zod'

export const uuidIdSchema = z.object({
  id: z.uuid('Invalid id'),
})

export const searchQueryParamSchema = z
  .string()
  .trim()
  .min(2, 'Search query must be at least 2 characters')
  .max(100, 'Search query is too long')

export const r2KeySchema = z
  .string()
  .trim()
  .min(1, 'Missing file key')
  .max(512, 'File key is too long')

export const toggleActiveSchema = z.object({
  id: z.uuid('Invalid id'),
  active: z.boolean(),
})

export const adminInviteTokenSchema = z
  .string()
  .trim()
  .min(32, 'Invalid invitation link')
  .max(128, 'Invalid invitation link')
  .regex(/^[a-f0-9]+$/i, 'Invalid invitation link')

/** Course slug from URL query (?course=). */
export const courseSlugParamSchema = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .optional()

/** Intake id from URL query (?intake=). */
export const intakeIdParamSchema = z.uuid().optional()

export const applySearchParamsSchema = z.object({
  course: courseSlugParamSchema,
  intake: intakeIdParamSchema,
})
