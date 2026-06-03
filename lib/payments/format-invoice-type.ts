export function formatInvoiceType(type: string, label?: string | null): string {
  if (label) return label
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
