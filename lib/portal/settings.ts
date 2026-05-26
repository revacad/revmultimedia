import { cache } from 'react'
import { getSystemSettings } from '@/lib/settings/cache'

/** Cached system settings (Redis + per-request dedupe). */
export const getPaymentSettings = cache(getSystemSettings)
