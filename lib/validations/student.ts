import { z } from 'zod'

export const updateProfilePhotoSchema = z.object({
  studentDbId: z.uuid(),
  r2Key: z.string().trim().min(1, 'Missing file key').max(512, 'File key is too long'),
})

export const uploadStudentDocumentSchema = z.object({
  studentDbId: z.uuid(),
  documentType: z.enum(['certificate', 'other'], { message: 'Invalid document type' }),
  r2Key: z.string().trim().min(1, 'Missing file key').max(512, 'File key is too long'),
  fileName: z.string().trim().min(1, 'File name is required').max(255, 'File name is too long'),
  fileSize: z.coerce
    .number()
    .int()
    .positive('File size must be greater than zero')
    .max(25 * 1024 * 1024, 'File too large'),
  mimeType: z.string().trim().min(1, 'Missing MIME type').max(100, 'MIME type is too long'),
})

