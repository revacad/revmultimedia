import { z } from 'zod'

export const portalInvoiceIdSchema = z.object({
  invoiceId: z.uuid(),
})

export const portalReceiptSchema = z.object({
  invoiceId: z.uuid(),
  installmentId: z.uuid().optional(),
})
