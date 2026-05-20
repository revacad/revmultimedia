const PDF_TIMEOUT_MS = 30_000

/** Stub until @react-pdf/renderer invoice templates are configured. */
export async function generateInvoicePdf(
  ..._args: [string, Record<string, unknown>, Record<string, string>]
): Promise<string | null> {
  void _args
  return null
}

export async function generateAndStoreInvoicePdf(
  invoiceId: string,
): Promise<string | null> {
  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('PDF generation timed out for invoice:', invoiceId)
        resolve(null)
      }, PDF_TIMEOUT_MS)
    })

    const generatePromise = async (): Promise<string | null> => {
      return generateInvoicePdf(invoiceId, {}, {})
    }

    return await Promise.race([generatePromise(), timeoutPromise])
  } catch (error) {
    console.error('PDF generation failed:', error)
    return null
  }
}
