import { z } from "zod";

export const generateInvoiceSchema = z.object({
  application_id: z.uuid(),
  amount_ghs: z.number().positive(),
  discount_ghs: z.number().nonnegative().default(0),
  promo_code: z.string().optional(),
  due_date: z.string().optional(),
  payment_method: z.enum([
    "paystack",
    "momo",
    "bank_transfer",
    "international_wire",
    "cash",
    "other",
  ]),
});
