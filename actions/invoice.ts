'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { generateAndStoreInvoicePdf } from '@/lib/pdf/generate'
import { sendTuitionInvoice } from '@/lib/notifications/email'
import { sendMessage } from '@/lib/notifications/sms'
import { invalidateAdminStats } from '@/lib/redis/invalidate'

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

    const { data: application } = await supabase
      .from('applications')
      .select('*, courses(title, tuition_fee_ghs), intakes(name, start_date)')
      .eq('id', data.applicationId)
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
      .eq('application_id', data.applicationId)
      .eq('type', 'tuition')
      .maybeSingle()

    if (existingTuition) {
      redirect(`/admin/payments/${existingTuition.id}`)
    }

    const { data: invoiceRef, error: refError } = await supabase.rpc('generate_invoice_ref', {
      p_type: 'inv',
    })

    if (refError || !invoiceRef) {
      console.error('generate_invoice_ref error:', refError)
      return { error: 'Failed to generate invoice reference' }
    }

    const totalGhs = Math.max(0, data.amountGhs - data.discountGhs)

    const { data: settings } = await supabase.from('system_settings').select('key, value')
    const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value ?? '']))

    const noteParts = [
      data.notes?.trim(),
      data.allowInstallments
        ? `Installment plan: ${data.installmentCount ?? 2} payments allowed`
        : null,
    ].filter(Boolean)

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        reference: invoiceRef as string,
        type: 'tuition',
        application_id: data.applicationId,
        amount_ghs: data.amountGhs,
        discount_ghs: data.discountGhs,
        promo_code_id: data.promoCodeId || null,
        total_ghs: totalGhs,
        due_date: data.dueDate,
        status: 'unpaid',
        discount_note: noteParts.length > 0 ? noteParts.join('\n') : null,
        created_by_admin_id: admin.id,
      })
      .select('id')
      .single()

    if (error || !invoice) {
      console.error('Invoice creation error:', error)
      return { error: 'Failed to create invoice' }
    }

    if (data.promoCodeId) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('uses_count')
        .eq('id', data.promoCodeId)
        .single()

      if (promo) {
        await supabase
          .from('promo_codes')
          .update({ uses_count: (promo.uses_count ?? 0) + 1 })
          .eq('id', data.promoCodeId)
      }
    }

    void generateAndStoreInvoicePdf(invoice.id).catch((err) => {
      console.error('Tuition invoice PDF generation failed:', err)
    })

    await sendTuitionInvoice(application.real_email, {
      name: application.full_name,
      reference: invoiceRef as string,
      amountGhs: totalGhs,
      dueDate: data.dueDate,
      isInternational: application.country !== 'Ghana',
      momoNumber: settingsMap.momo_number_1 || undefined,
      momoName: settingsMap.momo_name_1 || undefined,
      bankName: settingsMap.bank_name || undefined,
      bankAccount: settingsMap.bank_account_number || undefined,
      bankAccountName: settingsMap.bank_account_name || undefined,
      swiftCode: settingsMap.bank_swift_code || undefined,
      pdfUrl: '',
    })

    await sendMessage(
      application.phone,
      `Rev Multimedia: Invoice ${invoiceRef} for GHS ${totalGhs.toFixed(2)} generated. Check your email for payment details.`,
      'sms',
    )

    invalidateAdminStats()
    revalidatePath(`/admin/applications/${data.applicationId}`)
    revalidatePath('/admin/payments')
    redirect(`/admin/payments/${invoice.id}`)
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) {
      throw e
    }
    return {
      error: e instanceof Error ? e.message : 'Failed to generate invoice',
    }
  }
}
