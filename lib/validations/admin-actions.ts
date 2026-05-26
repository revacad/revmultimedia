import { z } from 'zod'

export const adminInviteIdSchema = z.object({
  inviteId: z.uuid(),
})

export const adminIdActivateSchema = z.object({
  adminId: z.uuid('Invalid admin id'),
  activate: z.boolean(),
})

export const acceptAdminInviteSchema = z.object({
  token: z
    .string()
    .trim()
    .min(32, 'Invalid invitation link')
    .max(128, 'Invalid invitation link')
    .regex(/^[a-f0-9]+$/i, 'Invalid invitation link'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

export const validateAdminInviteTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(32, 'Invalid invitation link')
    .max(128, 'Invalid invitation link')
    .regex(/^[a-f0-9]+$/i, 'Invalid invitation link'),
})

