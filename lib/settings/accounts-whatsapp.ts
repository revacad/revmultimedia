/** Digits only for wa.me links (no spaces or +). */
export function accountsWhatsAppDigits(phone: string | undefined | null): string {
  return phone?.replace(/\D/g, '') ?? ''
}

export function accountsWhatsAppWaMeUrl(phone: string | undefined | null): string | null {
  const digits = accountsWhatsAppDigits(phone)
  if (!digits) return null
  return `https://wa.me/${digits}`
}

export function accountsWhatsAppWaMePath(phone: string | undefined | null): string | null {
  const digits = accountsWhatsAppDigits(phone)
  if (!digits) return null
  return `wa.me/${digits}`
}
