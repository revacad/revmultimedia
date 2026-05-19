'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'

export async function createPromoCode(data: {
  code: string
  discountType: 'percentage' | 'flat_ghs'
  discountValue: number
  maxUses?: number | null
  expiresAt?: string | null
}): Promise<{ success: true } | { error: string }> {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    if (!admin) {
      return { error: 'Not an admin' }
    }

    const { error } = await supabase.from('promo_codes').insert({
      code: data.code.trim().toUpperCase(),
      discount_type: data.discountType,
      discount_value: data.discountValue,
      max_uses: data.maxUses ?? null,
      expires_at: data.expiresAt || null,
      created_by_admin_id: admin.id,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/promo-codes')
    return { success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to create promo code',
    }
  }
}

export async function setPromoCodeActive(
  promoId: string,
  isActive: boolean,
): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: isActive })
      .eq('id', promoId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/promo-codes')
    return { success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to update promo code',
    }
  }
}
