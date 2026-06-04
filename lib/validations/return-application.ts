import { z } from 'zod'

export const submitReturnStudentApplicationSchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(128),
  courseId: z.uuid('Invalid course'),
  intakeId: z.uuid('Invalid intake'),
  hybridAttendanceConfirmed: z.boolean().default(false),
})
