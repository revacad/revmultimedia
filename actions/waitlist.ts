'use server'

import { revalidatePath } from 'next/cache'
import { safeActionError } from '@/lib/errors/action'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaffAdmin } from '@/lib/auth/admin'
import { logAuditEvent } from '@/lib/audit/log'
import { createApplicationFeeInvoice } from '@/lib/invoices/create-app-fee-invoice'
import { sendAppFeeInvoice, sendWaitlistSpotAvailable } from '@/lib/notifications/email'
import {
  deliverWhatsAppThenSms,
  logNotification,
} from '@/lib/notifications/log-delivery'
import { runAfterResponse } from '@/lib/background'

export type WaitlistedApplicationRow = {
  id: string
  reference: string
  full_name: string
  real_email: string
  phone: string
  waitlist_position: number | null
  waitlist_notified_at: string | null
}

export async function getWaitlistedApplicationsForIntake(
  intakeId: string,
): Promise<WaitlistedApplicationRow[]> {
  await requireStaffAdmin()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('applications')
    .select(
      'id, reference, full_name, real_email, phone, waitlist_position, waitlist_notified_at',
    )
    .eq('intake_id', intakeId)
    .eq('status', 'waitlisted')
    .order('waitlist_position', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('getWaitlistedApplicationsForIntake:', error)
    return []
  }

  return (data ?? []) as WaitlistedApplicationRow[]
}

async function notifySingleWaitlistedApplication(
  supabase: ReturnType<typeof createAdminClient>,
  applicationId: string,
  adminId: string,
): Promise<{ success: true } | { error: string }> {
  const { data: app } = await supabase
    .from('applications')
    .select(
      `
      id,
      reference,
      full_name,
      real_email,
      phone,
      status,
      courses(title),
      intakes(name)
    `,
    )
    .eq('id', applicationId)
    .single()

  if (!app) {
    return { error: 'Application not found' }
  }

  if (app.status !== 'waitlisted') {
    return { error: 'Application is not on the waitlist' }
  }

  const course = Array.isArray(app.courses) ? app.courses[0] : app.courses
  const intake = Array.isArray(app.intakes) ? app.intakes[0] : app.intakes
  const courseName = (course as { title: string } | null)?.title ?? 'your course'
  const intakeName = (intake as { name: string } | null)?.name ?? 'your intake'

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('applications')
    .update({ waitlist_notified_at: now, updated_at: now })
    .eq('id', applicationId)

  if (updateError) {
    return safeActionError('waitlist.update', updateError, 'Failed to update waitlist.')
  }

  const smsMessage = `Rev Multimedia: Hi ${app.full_name.split(' ')[0]}, a spot may be available for ${courseName}. Log in to your portal (${app.reference}) to confirm interest and pay your application fee.`

  try {
    await sendWaitlistSpotAvailable(app.real_email, {
      name: app.full_name,
      reference: app.reference,
      courseName,
      intakeName,
    })
    await logNotification(supabase, {
      applicationId,
      channel: 'email',
      eventType: 'waitlist_spot_available',
      recipient: app.real_email,
      status: 'sent',
    })
  } catch (err) {
    await logNotification(supabase, {
      applicationId,
      channel: 'email',
      eventType: 'waitlist_spot_available',
      recipient: app.real_email,
      status: 'failed',
      providerResponse: {
        error: err instanceof Error ? err.message : 'Email send failed',
      },
    })
  }

  await deliverWhatsAppThenSms({
    phone: app.phone,
    message: smsMessage,
    applicationId,
    eventType: 'waitlist_spot_available',
    supabase,
  })

  await logAuditEvent({
    adminId,
    action: 'application.waitlist_notified',
    entityType: 'application',
    entityId: applicationId,
    newValue: { waitlist_notified_at: now },
  })

  return { success: true }
}

export async function notifyWaitlistedStudent(
  applicationId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const session = await requireStaffAdmin()
    const supabase = createAdminClient()

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    if (!admin) {
      return { error: 'Not an admin' }
    }

    const result = await notifySingleWaitlistedApplication(supabase, applicationId, admin.id)
    if ('error' in result) {
      return result
    }

    revalidatePath(`/admin/applications/${applicationId}`)
    revalidatePath('/admin/applications')
    revalidatePath('/admin/intakes')
    return { success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to notify student',
    }
  }
}

export async function notifyWaitlistedStudents(
  applicationIds: string[],
): Promise<{ success: true; notified: number } | { error: string }> {
  if (applicationIds.length === 0) {
    return { error: 'Select at least one student to notify' }
  }

  try {
    const session = await requireStaffAdmin()
    const supabase = createAdminClient()

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    if (!admin) {
      return { error: 'Not an admin' }
    }

    let notified = 0
    for (const applicationId of applicationIds) {
      const result = await notifySingleWaitlistedApplication(supabase, applicationId, admin.id)
      if ('success' in result) {
        notified += 1
      }
    }

    revalidatePath('/admin/applications')
    revalidatePath('/admin/intakes')
    return { success: true, notified }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to notify students',
    }
  }
}

export async function moveWaitlistedToActive(
  applicationId: string,
): Promise<{ success: true; invoiceReference?: string } | { error: string }> {
  try {
    const session = await requireStaffAdmin()
    const supabase = createAdminClient()

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    if (!admin) {
      return { error: 'Not an admin' }
    }

    const { data: app } = await supabase
      .from('applications')
      .select('id, status, reference, full_name, real_email, phone')
      .eq('id', applicationId)
      .single()

    if (!app) {
      return { error: 'Application not found' }
    }

    if (app.status !== 'waitlisted') {
      return { error: 'Application is not on the waitlist' }
    }

    const invoiceResult = await createApplicationFeeInvoice(supabase, applicationId)
    if ('error' in invoiceResult) {
      return { error: invoiceResult.error }
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'pending',
        waitlist_position: null,
        updated_at: now,
      })
      .eq('id', applicationId)

    if (updateError) {
      return safeActionError('waitlist.update', updateError, 'Failed to update waitlist.')
    }

    await logAuditEvent({
      adminId: admin.id,
      action: 'application.waitlist_moved_to_active',
      entityType: 'application',
      entityId: applicationId,
      oldValue: { status: 'waitlisted' },
      newValue: { status: 'pending', invoice_reference: invoiceResult.reference },
    })

    if (invoiceResult.created) {
      runAfterResponse(async () => {
        try {
          await sendAppFeeInvoice(app.real_email, {
            name: app.full_name,
            reference: invoiceResult.reference,
            amountGhs: invoiceResult.totalGhs,
          })
          await logNotification(supabase, {
            applicationId,
            channel: 'email',
            eventType: 'application_fee_invoice',
            recipient: app.real_email,
            status: 'sent',
          })
        } catch (err) {
          await logNotification(supabase, {
            applicationId,
            channel: 'email',
            eventType: 'application_fee_invoice',
            recipient: app.real_email,
            status: 'failed',
            providerResponse: {
              error: err instanceof Error ? err.message : 'Invoice email failed',
            },
          })
        }

        await deliverWhatsAppThenSms({
          phone: app.phone,
          message: `Rev Multimedia: Your application ${app.reference} is now active. Log in to your portal to pay the application fee (invoice ${invoiceResult.reference}).`,
          applicationId,
          eventType: 'application_fee_invoice',
          supabase,
        })
      })
    }

    revalidatePath(`/admin/applications/${applicationId}`)
    revalidatePath('/admin/applications')
    revalidatePath('/admin/intakes')
    return { success: true, invoiceReference: invoiceResult.reference }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to move application to active',
    }
  }
}

export async function getWaitlistCountsByIntake(): Promise<Record<string, number>> {
  await requireStaffAdmin()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('applications')
    .select('intake_id')
    .eq('status', 'waitlisted')

  if (error) {
    console.error('getWaitlistCountsByIntake:', error)
    return {}
  }

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const intakeId = row.intake_id as string
    counts[intakeId] = (counts[intakeId] ?? 0) + 1
  }
  return counts
}
