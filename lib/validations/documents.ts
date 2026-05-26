import { z } from 'zod'

export const getDocumentUrlSchema = z.object({
  r2Key: z.string().trim().min(1, 'Missing file key').max(512, 'File key is too long'),
})

