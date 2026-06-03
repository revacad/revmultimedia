'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaffAdmin } from '@/lib/auth/admin'
import {
  createPromoCodeSchema,
  setPromoCodeActiveSchema,
} from '@/lib/validations/promo'
import { safeActionError } from '@/lib/errors/action'

export async function createPromoCode(data: {
  code: string
  discountType: 'percentage' | 'flat_ghs'
  discountValue: number
  maxUses?: number | null
  expiresAt?: string | null
}): Promise<{ success: true } | { error: string }> {
  try {
    const parsed = createPromoCodeSchema.safeParse(data)
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid promo code',
      }
    }

    const session = await requireStaffAdmin()
    const supabase = createAdminClient()
    const payload = parsed.data

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    if (!admin) {
      return { error: 'Not an admin' }
    }

    const { error } = await supabase.from('promo_codes').insert({
      code: payload.code,
      discount_type: payload.discountType,
      discount_value: payload.discountValue,
      max_uses: payload.maxUses ?? null,
      expires_at: payload.expiresAt || null,
      created_by_admin_id: admin.id,
    })

    if (error) {
      return safeActionError('promo.create', error, 'Failed to create promo code.')
    }

    revalidatePath('/admin/promo-codes')
    return { success: true }
  } catch (e) {
    return safeActionError('promo.create', e, 'Failed to create promo code.')
  }
}

export async function setPromoCodeActive(
  promoId: string,
  isActive: boolean,
): Promise<{ success: true } | { error: string }> {
  try {
    const parsed = setPromoCodeActiveSchema.safeParse({ promoId, isActive })
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid request',
      }
    }

    await requireStaffAdmin()
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: parsed.data.isActive })
      .eq('id', parsed.data.promoId)

    if (error) {
      return safeActionError('promo.setActive', error, 'Failed to update promo code.')
    }

    revalidatePath('/admin/promo-codes')
    return { success: true }
  } catch (e) {
    return safeActionError('promo.setActive', e, 'Failed to update promo code.')
  }
}
