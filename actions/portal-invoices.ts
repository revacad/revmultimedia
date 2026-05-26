'use server'

import {
  generateAndStoreInvoicePdf,
  generateAndStorePaystackReceiptPdf,
  generateAndStoreReceiptPdf,
} from '@/lib/pdf/generate'
import { invoicePdfPath, receiptPdfPath } from '@/lib/r2/paths'
import { generatePresignedDownloadUrl } from '@/lib/r2/presign'
import { getInvoiceIfOwnedByUser } from '@/lib/portal/verify-invoice-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import {
  portalInvoiceIdSchema,
  portalReceiptSchema,
} from '@/lib/validations/portal-invoices'

async function requirePortalAuthUserId(): Promise<string | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

function presignKey(key: string): Promise<string> {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  if (!bucket) {
    throw new Error('File storage is not configured')
  }
  return generatePresignedDownloadUrl(bucket, key, 900)
}

export async function getPortalInvoicePdfUrl(
  invoiceId: string,
): Promise<{ url: string } | { error: string }> {
  try {
    const parsed = portalInvoiceIdSchema.safeParse({ invoiceId })
    if (!parsed.success) {
      return { error: 'Invalid invoice' }
    }

    const userId = await requirePortalAuthUserId()
    if (!userId) return { error: 'Please sign in' }

    const admin = createAdminClient()
    const invoice = await getInvoiceIfOwnedByUser(
      admin,
      userId,
      parsed.data.invoiceId,
    )
    if (!invoice) return { error: 'Invoice not found' }

    let key = invoice.r2_key ?? invoicePdfPath(invoice.reference)
    if (!invoice.r2_key) {
      const generated = await generateAndStoreInvoicePdf(invoice.id)
      if (generated) key = generated
    }

    const url = await presignKey(key)
    return { url }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Could not open invoice PDF',
    }
  }
}

export async function getPortalReceiptPdfUrl(
  invoiceId: string,
  installmentId?: string,
): Promise<{ url: string } | { error: string }> {
  try {
    const parsed = portalReceiptSchema.safeParse({ invoiceId, installmentId })
    if (!parsed.success) {
      return { error: 'Invalid receipt request' }
    }

    const userId = await requirePortalAuthUserId()
    if (!userId) return { error: 'Please sign in' }

    const admin = createAdminClient()
    const invoice = await getInvoiceIfOwnedByUser(
      admin,
      userId,
      parsed.data.invoiceId,
    )
    if (!invoice) return { error: 'Invoice not found' }

    if (invoice.status !== 'paid' && invoice.status !== 'partially_paid') {
      return { error: 'No receipt available yet' }
    }

    if (parsed.data.installmentId) {
      const { data: installment } = await admin
        .from('installments')
        .select('id')
        .eq('id', parsed.data.installmentId)
        .eq('invoice_id', invoice.id)
        .maybeSingle()

      if (!installment) return { error: 'Receipt not found' }

      await generateAndStoreReceiptPdf(installment.id)
      const key = receiptPdfPath(invoice.reference, installment.id)
      const url = await presignKey(key)
      return { url }
    }

    if (invoice.payment_method === 'paystack' && invoice.paystack_reference) {
      await generateAndStorePaystackReceiptPdf(invoice.id, invoice.paystack_reference)
      const key = receiptPdfPath(
        invoice.reference,
        `paystack-${invoice.paystack_reference.slice(-8)}`,
      )
      const url = await presignKey(key)
      return { url }
    }

    const { data: latest } = await admin
      .from('installments')
      .select('id')
      .eq('invoice_id', invoice.id)
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latest) {
      return { error: 'No receipt available yet' }
    }

    await generateAndStoreReceiptPdf(latest.id)
    const key = receiptPdfPath(invoice.reference, latest.id)
    const url = await presignKey(key)
    return { url }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Could not open receipt PDF',
    }
  }
}
