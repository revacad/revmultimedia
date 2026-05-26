'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { invalidateAdminStats } from '@/lib/redis/invalidate'
import { runAfterResponse } from '@/lib/background'
import { calculatePromoDiscount } from '@/lib/promo/calculate'
import {
  createApplicationInvoice,
  sendApplicationInvoiceNotifications,
} from '@/lib/invoices/create-application-invoice'
import {
  createTuitionInvoice,
  sendTuitionInvoiceNotifications,
} from '@/lib/promo/create-tuition-invoice'
import {
  createApplicationInvoiceSchema,
  generateTuitionInvoiceSchema,
} from '@/lib/validations/invoice'

export async function createAndSendApplicationInvoice(data: {
  applicationId: string
  paymentTypeId: string
  amountGhs: number
  discountGhs: number
  promoCodeId?: string
  dueDate: string
  allowInstallments: boolean
  installmentCount?: number
  notes?: string
}): Promise<{ error: string } | void> {
  try {
    const parsed = createApplicationInvoiceSchema.safeParse(data)
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid invoice details',
      }
    }

    const session = await requireAdmin()
    const supabase = createAdminClient()
    const payload = parsed.data

    const { data: paymentType } = await supabase
      .from('payment_types')
      .select('id, slug, label, is_active')
      .eq('id', payload.paymentTypeId)
      .maybeSingle()

    if (!paymentType?.is_active) {
      return { error: 'Payment type not found or inactive' }
    }

    if (paymentType.slug === 'application_fee') {
      return {
        error: 'Application fee invoices are created automatically when a student applies',
      }
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    if (!admin) {
      return { error: 'Not an admin' }
    }

    const { data: application } = await supabase
      .from('applications')
      .select('*, courses(title, tuition_fee_ghs), intakes(name, start_date)')
      .eq('id', payload.applicationId)
      .single()

    if (!application) {
      return { error: 'Application not found' }
    }

    if (application.status !== 'accepted') {
      return {
        error: 'Only accepted applications can receive invoices. Accept the application first.',
      }
    }

    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('application_id', payload.applicationId)
      .eq('type', paymentType.slug)
      .maybeSingle()

    if (
      existingInvoice &&
      (paymentType.slug === 'tuition' || paymentType.slug === 'application_fee')
    ) {
      redirect(`/admin/payments/${existingInvoice.id}`)
    }

    let discountGhs = payload.discountGhs
    if (payload.promoCodeId && paymentType.slug === 'tuition') {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('id, code, discount_type, discount_value')
        .eq('id', payload.promoCodeId)
        .single()
      if (promo) {
        discountGhs = calculatePromoDiscount(payload.amountGhs, {
          id: promo.id,
          code: promo.code,
          discount_type: promo.discount_type as 'percentage' | 'flat_ghs',
          discount_value: Number(promo.discount_value),
        })
      }
    } else if (payload.promoCodeId && paymentType.slug !== 'tuition') {
      return { error: 'Promo codes apply to tuition invoices only' }
    }

    const noteParts = [
      payload.notes?.trim(),
      payload.allowInstallments
        ? `Installment plan: ${payload.installmentCount ?? 2} payments allowed`
        : null,
    ].filter(Boolean)

    const invoiceResult = await createApplicationInvoice(supabase, application, {
      applicationId: payload.applicationId,
      adminId: admin.id,
      paymentTypeSlug: paymentType.slug,
      paymentTypeLabel: paymentType.label,
      amountGhs: payload.amountGhs,
      discountGhs,
      promoCodeId: paymentType.slug === 'tuition' ? payload.promoCodeId || null : null,
      dueDate: payload.dueDate,
      notes: noteParts.length > 0 ? noteParts.join('\n') : undefined,
      allowInstallments:
        paymentType.slug === 'tuition' ? payload.allowInstallments : false,
      installmentCount: payload.installmentCount,
    })

    if ('error' in invoiceResult) {
      return { error: invoiceResult.error }
    }

    if (!invoiceResult.created) {
      redirect(`/admin/payments/${invoiceResult.invoiceId}`)
    }

    runAfterResponse(async () => {
      await sendApplicationInvoiceNotifications(
        application,
        invoiceResult.reference,
        invoiceResult.totalGhs,
        payload.dueDate,
        invoiceResult.invoiceId,
        paymentType.label,
      )
    })

    invalidateAdminStats()
    revalidatePath(`/admin/applications/${payload.applicationId}`)
    revalidatePath('/admin/payments')
    redirect(`/admin/payments/${invoiceResult.invoiceId}`)
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) {
      throw e
    }
    return {
      error: e instanceof Error ? e.message : 'Failed to create invoice',
    }
  }
}

export async function generateTuitionInvoice(data: {
  applicationId: string
  amountGhs: number
  discountGhs: number
  promoCodeId?: string
  dueDate: string
  allowInstallments: boolean
  installmentCount?: number
  notes?: string
}): Promise<{ error: string } | void> {
  try {
    const parsed = generateTuitionInvoiceSchema.safeParse(data)
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid invoice details',
      }
    }

    const session = await requireAdmin()
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

    const { data: application } = await supabase
      .from('applications')
      .select('*, courses(title, tuition_fee_ghs), intakes(name, start_date)')
      .eq('id', payload.applicationId)
      .single()

    if (!application) {
      return { error: 'Application not found' }
    }

    if (application.status !== 'accepted') {
      return { error: 'Application must be accepted before generating tuition invoice' }
    }

    const { data: existingTuition } = await supabase
      .from('invoices')
      .select('id')
      .eq('application_id', payload.applicationId)
      .eq('type', 'tuition')
      .maybeSingle()

    if (existingTuition) {
      redirect(`/admin/payments/${existingTuition.id}`)
    }

    let discountGhs = payload.discountGhs
    if (payload.promoCodeId) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('id, code, discount_type, discount_value')
        .eq('id', payload.promoCodeId)
        .single()
      if (promo) {
        discountGhs = calculatePromoDiscount(payload.amountGhs, {
          id: promo.id,
          code: promo.code,
          discount_type: promo.discount_type as 'percentage' | 'flat_ghs',
          discount_value: Number(promo.discount_value),
        })
      }
    }

    const noteParts = [
      payload.notes?.trim(),
      payload.allowInstallments
        ? `Installment plan: ${payload.installmentCount ?? 2} payments allowed`
        : null,
    ].filter(Boolean)

    const invoiceResult = await createTuitionInvoice(supabase, application, {
      applicationId: payload.applicationId,
      adminId: admin.id,
      amountGhs: payload.amountGhs,
      discountGhs,
      promoCodeId: payload.promoCodeId || null,
      dueDate: payload.dueDate,
      notes: noteParts.length > 0 ? noteParts.join('\n') : undefined,
      allowInstallments: payload.allowInstallments,
      installmentCount: payload.installmentCount,
    })

    if ('error' in invoiceResult) {
      return { error: invoiceResult.error }
    }

    if (invoiceResult.created) {
      runAfterResponse(async () => {
        await sendTuitionInvoiceNotifications(
          application,
          invoiceResult.reference,
          invoiceResult.totalGhs,
          payload.dueDate,
          invoiceResult.invoiceId,
        )
      })
    }

    invalidateAdminStats()
    revalidatePath(`/admin/applications/${payload.applicationId}`)
    revalidatePath('/admin/payments')
    redirect(`/admin/payments/${invoiceResult.invoiceId}`)
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) {
      throw e
    }
    return {
      error: e instanceof Error ? e.message : 'Failed to generate invoice',
    }
  }
}
