import { z } from 'zod'

const uploadedFileSchema = z.object({
  key: z.string().trim().min(1).max(512),
  fileName: z.string().trim().min(1).max(255),
  fileSize: z.coerce
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024, 'File is too large'),
  mimeType: z.string().trim().min(1).max(100),
})

export const submitReturnStudentApplicationSchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(128),
  courseId: z.uuid('Invalid course'),
  intakeId: z.uuid('Invalid intake'),
  hybridAttendanceConfirmed: z.boolean().default(false),
  documents: z.object({
    idDocument: uploadedFileSchema,
    passportPhoto: uploadedFileSchema,
    certificates: z.array(uploadedFileSchema).max(3).optional(),
  }),
})
