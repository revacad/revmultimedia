const INVOICE_TYPE_LABELS: Record<string, string> = {
  application_fee: 'Application Fee',
  tuition: 'Tuition Fee',
}

export function formatInvoiceType(type: string, label?: string | null): string {
  const trimmed = label?.trim()
  if (trimmed) return trimmed
  if (INVOICE_TYPE_LABELS[type]) return INVOICE_TYPE_LABELS[type]
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
