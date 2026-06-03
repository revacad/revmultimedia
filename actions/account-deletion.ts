'use server'

import { revalidatePath } from 'next/cache'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import { requireSuperAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSystemSettings } from '@/lib/settings/cache'
import {
  sendAccountDeletionCompleted,
  sendDeletionRequestAdminAlert,
  sendDeletionRequestReceived,
} from '@/lib/notifications/email'
import {
  executeAccountDeletion,
  loadAccountDeletionContext,
} from '@/lib/compliance/complete-account-deletion'
import { logAuditEvent } from '@/lib/audit/log'
import { getClientIp } from '@/lib/auth/getClientIp'
import { safeActionError, safeActionFailure } from '@/lib/errors/action'
import { supabaseErrorFields } from '@/lib/logging/redact'

async function resolveStudentContact(authUserId: string): Promise<{
  name: string
  email: string
} | null> {
  const admin = createAdminClient()

  const { data: student } = await admin
    .from('students')
    .select('full_name, real_email')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (student?.real_email) {
    return {
      name: student.full_name,
      email: student.real_email,
    }
  }

  const { data: application } = await admin
    .from('applications')
    .select('full_name, real_email')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!application?.real_email) return null

  return {
    name: application.full_name,
    email: application.real_email,
  }
}

export async function requestAccountDeletion(): Promise<
  { success: true } | { error: string }
> {
  try {
    const user = await requirePortalUser()
    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('deletion_requests')
      .select('id')
      .eq('student_auth_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return {
        error:
          'You already have a pending deletion request. We will process it within 30 days.',
      }
    }

    const contact = await resolveStudentContact(user.id)
    if (!contact) {
      return { error: 'No account data found to delete.' }
    }

    const { error: insertError } = await admin.from('deletion_requests').insert({
      student_auth_user_id: user.id,
      student_name: contact.name,
      student_email: contact.email,
      status: 'pending',
    })

    if (insertError) {
      console.error(
        '[compliance] deletion request insert failed',
        supabaseErrorFields(insertError),
      )
      return { error: 'Could not submit your request. Please try again.' }
    }

    const ip = await getClientIp()
    await logAuditEvent({
      actorId: user.id,
      actorType: 'student',
      action: 'deletion_requested',
      targetType: 'user',
      targetId: user.id,
      metadata: { email: contact.email },
      ipAddress: ip,
    })

    const settings = await getSystemSettings()
    const adminEmail =
      settings.academy_email?.trim() ||
      process.env.RESEND_ADMIN_EMAIL ||
      'admin@revmultimediagh.com'

    await Promise.all([
      sendDeletionRequestReceived(contact.email, contact.name),
      sendDeletionRequestAdminAlert({
        adminEmail,
        studentName: contact.name,
        studentEmail: contact.email,
      }),
    ])

    revalidatePath('/portal/profile')
    revalidatePath('/admin/compliance')

    return { success: true }
  } catch (error) {
    return safeActionError('requestAccountDeletion', error)
  }
}

export async function completeAccountDeletion(
  requestId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const { data: request, error: fetchError } = await admin
      .from('deletion_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()

    if (fetchError || !request) {
      return { success: false, error: 'Deletion request not found.' }
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'This request has already been processed.' }
    }

    const ctx = await loadAccountDeletionContext(
      request.student_auth_user_id as string,
    )

    if (!ctx) {
      return { success: false, error: 'No student data found for this account.' }
    }

    const notifyEmail = request.student_email as string
    const completedAt = new Date().toISOString()

    await admin
      .from('deletion_requests')
      .update({
        status: 'completed',
        completed_at: completedAt,
      })
      .eq('id', requestId)

    const deletionResult = await executeAccountDeletion(ctx)

    if (deletionResult.error) {
      await admin
        .from('deletion_requests')
        .update({
          status: 'pending',
          completed_at: null,
        })
        .eq('id', requestId)
      return { success: false, error: deletionResult.error }
    }

    await sendAccountDeletionCompleted(notifyEmail)

    await logAuditEvent({
      actorId: request.student_auth_user_id as string,
      actorType: 'student',
      action: 'deletion_completed',
      targetType: 'deletion_request',
      targetId: requestId,
      metadata: { email: notifyEmail },
    })

    revalidatePath('/admin/compliance')
    revalidatePath('/portal/profile')

    return { success: true }
  } catch (error) {
    return safeActionFailure('completeAccountDeletion', error)
  }
}

export async function rejectAccountDeletion(
  requestId: string,
  reason: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireSuperAdmin()

    const trimmed = reason.trim()
    if (!trimmed) {
      return { success: false, error: 'Please provide a reason for rejection.' }
    }

    const admin = createAdminClient()

    const { data: request } = await admin
      .from('deletion_requests')
      .select('status')
      .eq('id', requestId)
      .maybeSingle()

    if (!request) {
      return { success: false, error: 'Deletion request not found.' }
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'This request has already been processed.' }
    }

    const { error } = await admin
      .from('deletion_requests')
      .update({
        status: 'rejected',
        completed_at: new Date().toISOString(),
        rejected_reason: trimmed,
      })
      .eq('id', requestId)

    if (error) {
      console.error('[compliance] reject deletion failed', supabaseErrorFields(error))
      return { success: false, error: 'Could not reject this request.' }
    }

    revalidatePath('/admin/compliance')

    return { success: true }
  } catch (error) {
    return safeActionFailure('rejectAccountDeletion', error)
  }
}
