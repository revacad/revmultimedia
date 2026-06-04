import { getSystemSettings } from '@/lib/settings/cache'

export async function getApplicationFeeGhs(): Promise<number> {
  const settings = await getSystemSettings()
  const fee = Number(settings.application_fee_ghs ?? 100)
  return Number.isFinite(fee) ? fee : 100
}
