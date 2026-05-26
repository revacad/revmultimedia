export type PortalReceiptLink = {
  installmentId: string | null
  label: string
  paidAt: string
  amountGhs: number
}

type InvoiceForReceipts = {
  status: string
  paystack_reference: string | null
  total_ghs: number
  installments: { id: string; amount_ghs: number; paid_at: string }[]
}

/** Build receipt links from installments already loaded on the invoice row (no extra queries). */
export function buildReceiptLinksFromPortalInvoice(
  invoice: InvoiceForReceipts,
): PortalReceiptLink[] {
  if (invoice.status === 'unpaid' || invoice.status === 'waived') {
    return []
  }

  const installments = [...invoice.installments]
    .filter((row) => row.paid_at)
    .sort(
      (a, b) =>
        new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime(),
    )

  if (installments.length > 0) {
    return installments.map((row, index) => ({
      installmentId: row.id,
      label:
        installments.length > 1
          ? `Receipt ${index + 1} of ${installments.length}`
          : 'Payment receipt',
      paidAt: row.paid_at,
      amountGhs: Number(row.amount_ghs),
    }))
  }

  if (invoice.status === 'paid' && invoice.paystack_reference) {
    return [
      {
        installmentId: null,
        label: 'Payment receipt',
        paidAt: new Date().toISOString(),
        amountGhs: Number(invoice.total_ghs),
      },
    ]
  }

  return []
}
