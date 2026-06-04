import { z } from 'zod'

export const submitManualPaymentClaimSchema = z.object({
  invoiceId: z.uuid('Invalid invoice'),
  transactionRef: z
    .string()
    .trim()
    .min(1, 'MoMo reference or transaction description is required')
    .max(200, 'Reference is too long'),
})

export const manualPaymentClaimIdSchema = z.object({
  claimId: z.uuid('Invalid claim'),
})
