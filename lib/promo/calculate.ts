export type PromoCodeOption = {
  id: string
  code: string
  discount_type: 'percentage' | 'flat_ghs'
  discount_value: number
}

export function calculatePromoDiscount(
  amountGhs: number,
  promo: PromoCodeOption | null,
): number {
  if (!promo) return 0
  if (promo.discount_type === 'percentage') {
    return Math.min(amountGhs, (amountGhs * Number(promo.discount_value)) / 100)
  }
  return Math.min(amountGhs, Number(promo.discount_value))
}
