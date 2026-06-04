export function isPaystackEnabled(settings: Record<string, string>): boolean {
  const value = settings.paystack_enabled?.trim().toLowerCase()
  return value !== 'false' && value !== '0' && value !== 'no'
}
