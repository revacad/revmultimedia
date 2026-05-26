import { z } from 'zod'

export const uploadResourceSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title is too long'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description is too long')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  r2Key: z.string().trim().min(1, 'Missing file key').max(512, 'File key is too long'),
  fileName: z.string().trim().min(1, 'File name is required').max(255, 'File name is too long'),
  fileType: z.enum(['pdf', 'image'], { message: 'Invalid file type' }),
  fileSize: z.coerce
    .number()
    .int()
    .positive('File size must be greater than zero')
    .max(25 * 1024 * 1024, 'File too large'),
  visibility: z.enum(['all_students', 'course_specific', 'intake_specific'], {
    message: 'Invalid visibility',
  }),
  courseId: z.uuid().optional(),
  intakeId: z.uuid().optional(),
})

export const deleteResourceSchema = z.object({
  resourceId: z.uuid(),
})

export const resourceUrlSchema = z.object({
  resourceId: z.uuid(),
})

