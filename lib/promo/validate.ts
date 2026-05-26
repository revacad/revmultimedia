import type { SupabaseClient } from '@supabase/supabase-js'
import type { PromoCodeOption } from '@/lib/promo/calculate'

export type PromoRow = {
  id: string
  code: string
  discount_type: 'percentage' | 'flat_ghs'
  discount_value: number
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
}

export function formatPromoLabel(promo: Pick<PromoRow, 'discount_type' | 'discount_value'>): string {
  if (promo.discount_type === 'percentage') {
    return `${promo.discount_value}% off tuition`
  }
  return `GHS ${Number(promo.discount_value).toFixed(2)} off tuition`
}

export function mapPromoRow(row: PromoRow): PromoCodeOption {
  return {
    id: row.id,
    code: row.code,
    discount_type: row.discount_type,
    discount_value: Number(row.discount_value),
  }
}

export async function fetchPromoById(
  supabase: SupabaseClient,
  promoId: string,
): Promise<PromoRow | null> {
  const { data } = await supabase
    .from('promo_codes')
    .select('id, code, discount_type, discount_value, max_uses, uses_count, expires_at, is_active')
    .eq('id', promoId)
    .maybeSingle()

  return data as PromoRow | null
}

export async function fetchPromoByCode(
  supabase: SupabaseClient,
  code: string,
): Promise<PromoRow | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null

  const { data } = await supabase
    .from('promo_codes')
    .select('id, code, discount_type, discount_value, max_uses, uses_count, expires_at, is_active')
    .eq('code', normalized)
    .maybeSingle()

  return data as PromoRow | null
}

export function validatePromoRow(
  promo: PromoRow | null,
  options?: { checkUsageLimit?: boolean },
): { ok: true; promo: PromoRow } | { ok: false; error: string } {
  if (!promo) {
    return { ok: false, error: 'Promo code not found' }
  }
  if (!promo.is_active) {
    return { ok: false, error: 'This promo code is no longer active' }
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { ok: false, error: 'This promo code has expired' }
  }
  if (
    options?.checkUsageLimit !== false &&
    promo.max_uses != null &&
    promo.uses_count >= promo.max_uses
  ) {
    return { ok: false, error: 'This promo code has reached its usage limit' }
  }
  return { ok: true, promo }
}
