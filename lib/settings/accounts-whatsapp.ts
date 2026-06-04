/** Digits only for wa.me links (no spaces or +). */
export function accountsWhatsAppWaMeUrl(phone: string | undefined | null): string | null {
  const digits = phone?.replace(/\D/g, '') ?? ''
  if (!digits) return null
  return `https://wa.me/${digits}`
}
