import { z } from 'zod'

export const uploadCertificateSchema = z.object({
  studentId: z.uuid(),
  enrollmentId: z.uuid(),
  courseId: z.uuid(),
  r2Key: z.string().trim().min(1, 'Missing file key').max(512, 'File key is too long'),
  fileName: z.string().trim().min(1, 'File name is required').max(255, 'File name is too long'),
})

