'use server'

import { revalidatePath } from 'next/cache'
import { requireFinanceAccess } from '@/lib/auth/admin'
import { PROTECTED_PAYMENT_TYPE_SLUGS } from '@/lib/payments/payment-types'
import { sanitizePlainText } from '@/lib/security/html'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createPaymentTypeSchema,
  setPaymentTypeActiveSchema,
  updatePaymentTypeSchema,
} from '@/lib/validations/payment-types'
import { safeActionError } from '@/lib/errors/action'

export async function createPaymentType(data: {
  slug: string
  label: string
  description?: string
  sortOrder?: number
}): Promise<{ success: true } | { error: string }> {
  try {
    const parsed = createPaymentTypeSchema.safeParse(data)
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid payment type',
      }
    }

    await requireFinanceAccess()
    const supabase = createAdminClient()
    const payload = parsed.data

    const { error } = await supabase.from('payment_types').insert({
      slug: payload.slug,
      label: sanitizePlainText(payload.label, 120),
      description: payload.description
        ? sanitizePlainText(payload.description, 500)
        : null,
      sort_order: payload.sortOrder,
      is_active: true,
    })

    if (error) {
      if (error.code === '23505') {
        return { error: 'A payment type with this slug already exists' }
      }
      return safeActionError('paymentType.create', error, 'Failed to create payment type.')
    }

    revalidatePath('/admin/payment-types')
    revalidatePath('/admin/payments')
    return { success: true }
  } catch (e) {
    return safeActionError('paymentType.create', e, 'Failed to create payment type.')
  }
}

export async function updatePaymentType(data: {
  id: string
  label: string
  description?: string | null
  sortOrder: number
  allowPaystack?: boolean
}): Promise<{ success: true } | { error: string }> {
  try {
    const parsed = updatePaymentTypeSchema.safeParse(data)
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid payment type',
      }
    }

    await requireFinanceAccess()
    const supabase = createAdminClient()
    const payload = parsed.data

    const { data: existing } = await supabase
      .from('payment_types')
      .select('slug')
      .eq('id', payload.id)
      .maybeSingle()

    const updatePayload: Record<string, unknown> = {
      label: sanitizePlainText(payload.label, 120),
      description:
        payload.description != null
          ? sanitizePlainText(payload.description, 500)
          : null,
      sort_order: payload.sortOrder,
    }

    if (
      payload.allowPaystack !== undefined &&
      existing &&
      !PROTECTED_PAYMENT_TYPE_SLUGS.includes(
        existing.slug as (typeof PROTECTED_PAYMENT_TYPE_SLUGS)[number],
      )
    ) {
      updatePayload.allow_paystack = payload.allowPaystack
    }

    const { error } = await supabase
      .from('payment_types')
      .update(updatePayload)
      .eq('id', payload.id)

    if (error) {
      return safeActionError('paymentType.update', error, 'Failed to update payment type.')
    }

    revalidatePath('/admin/payment-types')
    revalidatePath('/admin/payments')
    return { success: true }
  } catch (e) {
    return safeActionError('paymentType.update', e, 'Failed to update payment type.')
  }
}

export async function setPaymentTypeActive(
  id: string,
  isActive: boolean,
): Promise<{ success: true } | { error: string }> {
  try {
    const parsed = setPaymentTypeActiveSchema.safeParse({ id, isActive })
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid request',
      }
    }

    await requireFinanceAccess()
    const supabase = createAdminClient()

    const { data: row } = await supabase
      .from('payment_types')
      .select('slug')
      .eq('id', parsed.data.id)
      .maybeSingle()

    if (!row) {
      return { error: 'Payment type not found' }
    }

    if (
      !parsed.data.isActive &&
      PROTECTED_PAYMENT_TYPE_SLUGS.includes(
        row.slug as (typeof PROTECTED_PAYMENT_TYPE_SLUGS)[number],
      )
    ) {
      return {
        error: 'Application fee and tuition cannot be deactivated — they are required by the system',
      }
    }

    const { error } = await supabase
      .from('payment_types')
      .update({ is_active: parsed.data.isActive })
      .eq('id', parsed.data.id)

    if (error) {
      return safeActionError('paymentType.setActive', error, 'Failed to update payment type status.')
    }

    revalidatePath('/admin/payment-types')
    revalidatePath('/admin/payments')
    return { success: true }
  } catch (e) {
    return safeActionError('paymentType.setActive', e, 'Failed to update payment type status.')
  }
}
