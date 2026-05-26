import { z } from 'zod'

export const inviteAdminSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(200, 'Name is too long'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
    .email('Please enter a valid email address'),
  role: z.enum(['admin', 'superadmin'], {
    message: 'Invalid role',
  }),
})

export const adminInviteIdSchema = z.object({
  inviteId: z.uuid(),
})

export const adminIdSchema = z.object({
  adminId: z.uuid(),
})
