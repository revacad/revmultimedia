import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdmissionLetterDocument } from '@/lib/pdf/AdmissionLetterDocument'
import { InvoiceDocument } from '@/lib/pdf/InvoiceDocument'
import { ReceiptDocument } from '@/lib/pdf/ReceiptDocument'
import {
  fetchAdmissionLetterPdfData,
  fetchInvoicePdfData,
  fetchReceiptPdfData,
} from '@/lib/pdf/fetch-data'
import { renderPdfToBuffer } from '@/lib/pdf/render'
import { admissionLetterPdfPath, invoicePdfPath, receiptPdfPath } from '@/lib/r2/paths'
import { uploadBufferToR2 } from '@/lib/r2/upload-buffer'

const PDF_TIMEOUT_MS = 30_000

export async function generateAndStoreInvoicePdf(invoiceId: string): Promise<string | null> {
  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('PDF generation timed out for invoice:', invoiceId)
        resolve(null)
      }, PDF_TIMEOUT_MS)
    })

    const generatePromise = async (): Promise<string | null> => {
      const supabase = createAdminClient()
      const data = await fetchInvoicePdfData(supabase, invoiceId)
      if (!data) return null

      const buffer = await renderPdfToBuffer(
        React.createElement(InvoiceDocument, { data }),
      )
      const key = invoicePdfPath(data.reference)
      await uploadBufferToR2(key, buffer, 'application/pdf')

      await supabase.from('invoices').update({ r2_key: key }).eq('id', invoiceId)

      return key
    }

    return await Promise.race([generatePromise(), timeoutPromise])
  } catch (error) {
    console.error('Invoice PDF generation failed:', error)
    return null
  }
}

export async function generateAndStorePaystackReceiptPdf(
  invoiceId: string,
  paystackReference: string,
): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const invoiceData = await fetchInvoicePdfData(supabase, invoiceId)
    if (!invoiceData) return null

    const receiptData = {
      receiptId: paystackReference.slice(0, 12),
      invoiceReference: invoiceData.reference,
      paymentForLabel: invoiceData.paymentForLabel,
      studentName: invoiceData.studentName,
      amountPaidGhs: invoiceData.totalGhs,
      totalInvoiceGhs: invoiceData.totalGhs,
      totalPaidGhs: invoiceData.totalGhs,
      remainingGhs: 0,
      paymentMethod: 'paystack',
      transactionRef: paystackReference,
      paidAt: new Date().toISOString().slice(0, 10),
      fullyPaid: true,
    }

    const buffer = await renderPdfToBuffer(
      React.createElement(ReceiptDocument, { data: receiptData }),
    )
    const key = receiptPdfPath(invoiceData.reference, `paystack-${paystackReference.slice(-8)}`)
    await uploadBufferToR2(key, buffer, 'application/pdf')
    return key
  } catch (error) {
    console.error('Paystack receipt PDF failed:', error)
    return null
  }
}

export async function generateAndStoreReceiptPdf(
  installmentId: string,
): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const data = await fetchReceiptPdfData(supabase, installmentId)
    if (!data) return null

    const buffer = await renderPdfToBuffer(
      React.createElement(ReceiptDocument, { data }),
    )
    const key = receiptPdfPath(data.invoiceReference, installmentId)
    await uploadBufferToR2(key, buffer, 'application/pdf')
    return key
  } catch (error) {
    console.error('Receipt PDF generation failed:', error)
    return null
  }
}

export async function generateAndStoreAdmissionLetterPdf(
  applicationId: string,
): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const data = await fetchAdmissionLetterPdfData(supabase, applicationId)
    if (!data) return null

    const buffer = await renderPdfToBuffer(
      React.createElement(AdmissionLetterDocument, { data }),
    )
    const key = admissionLetterPdfPath(data.applicationReference)
    await uploadBufferToR2(key, buffer, 'application/pdf')
    return key
  } catch (error) {
    console.error('Admission letter PDF generation failed:', error)
    return null
  }
}

/** @deprecated Use generateAndStoreInvoicePdf */
export async function generateInvoicePdf(
  ..._args: [string, Record<string, unknown>, Record<string, string>]
): Promise<string | null> {
  void _args
  return null
}
