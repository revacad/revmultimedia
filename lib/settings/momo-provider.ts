export const MOMO_PROVIDER_OPTIONS = ['MTN MoMo', 'Telecel Cash', 'AirtelTigo Money'] as const

export type MomoProviderOption = (typeof MOMO_PROVIDER_OPTIONS)[number]

export const DEFAULT_MOMO_PROVIDER: MomoProviderOption = 'MTN MoMo'

export function getMomoProviderName(settings: Record<string, string>): string {
  const value = settings.momo_provider?.trim()
  if (value && MOMO_PROVIDER_OPTIONS.includes(value as MomoProviderOption)) {
    return value
  }
  return DEFAULT_MOMO_PROVIDER
}

export function momoPaymentHeading(settings: Record<string, string>): string {
  return `Pay via ${getMomoProviderName(settings)}`
}
