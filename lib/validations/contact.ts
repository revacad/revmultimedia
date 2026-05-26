import { z } from 'zod'

export const submitContactFormSchema = z.object({
  website: z.string().max(500).optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Please enter your name')
    .max(200, 'Name is too long'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Please enter a valid email address')),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number is too long')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  message: z
    .string()
    .trim()
    .min(1, 'Please enter a message')
    .max(5000, 'Message is too long'),
})
