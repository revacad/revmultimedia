import { z } from 'zod'

export const sendAdmissionLetterSchema = z.object({
  applicationId: z.string().uuid('Invalid application'),
})
