'use server'

import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit/log'
import { getClientIp } from '@/lib/auth/getClientIp'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { sendPasswordReset } from '@/lib/notifications/email'
import {
  adminPasswordChangeLimit,
  adminPasswordResetLimit,
  checkRateLimit,
} from '@/lib/redis/ratelimit'
import { redis } from '@/lib/redis/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { invalidateAllAuthSessions } from '@/lib/auth/invalidate-sessions'
import { onLoginSuccess, signInWithFreshSession } from '@/lib/auth/login-session'
import { assertPasswordAttemptAllowed } from '@/lib/auth/password-attempts'
import { clearSessionBinding } from '@/lib/auth/session-binding'
import { createServerClient } from '@/lib/supabase/server'
import {
  adminChangePasswordSchema,
  adminPasswordResetConfirmSchema,
  adminPasswordResetRequestSchema,
} from '@/lib/validations/auth'

const ADMIN_RESET_GENERIC =
  'If an active admin account matches that email, you will receive a reset link shortly.'

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
}

export async function requestAdminPasswordReset(
  email: string,
): Promise<{ message: string }> {
  const ip = await getClientIp()
  const { allowed: ipAllowed } = await checkRateLimit(adminPasswordResetLimit, ip)
  if (!ipAllowed) {
    return { message: ADMIN_RESET_GENERIC }
  }

  const parsed = adminPasswordResetRequestSchema.safeParse({
    email: email.trim().toLowerCase(),
  })
  if (!parsed.success) {
    return { message: ADMIN_RESET_GENERIC }
  }

  const trimmedEmail = parsed.data.email
  const { allowed: emailAllowed } = await checkRateLimit(
    adminPasswordResetLimit,
    `email:${trimmedEmail}`,
  )
  if (!emailAllowed) {
    return { message: ADMIN_RESET_GENERIC }
  }

  const supabase = createAdminClient()
  const { data: admin } = await supabase
    .from('admins')
    .select('id, auth_user_id, full_name, email, is_active')
    .ilike('email', trimmedEmail)
    .maybeSingle()

  if (!admin?.auth_user_id || !admin.is_active) {
    return { message: ADMIN_RESET_GENERIC }
  }

  const token = randomUUID()
  await redis.set(
    `admin_password_reset:${token}`,
    {
      auth_user_id: admin.auth_user_id,
      admin_id: admin.id,
      email: trimmedEmail,
    },
    { ex: 3600 },
  )

  const resetUrl = `${appBaseUrl()}/admin/reset-password?token=${token}`
  await sendPasswordReset(trimmedEmail, {
    resetUrl,
    name: admin.full_name,
    isAdmin: true,
  })

  await logAuditEvent({
    adminId: admin.id,
    action: 'admin.password_reset_requested',
    entityType: 'admin',
    entityId: admin.id,
    newValue: { email: trimmedEmail },
  })

  return { message: ADMIN_RESET_GENERIC }
}

export async function confirmAdminPasswordReset(
  token: string,
  newPassword: string,
): Promise<{ error?: string }> {
  const parsed = adminPasswordResetConfirmSchema.safeParse({
    token,
    password: newPassword,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid reset details' }
  }

  const payload = await redis.get<{
    auth_user_id: string
    admin_id: string
    email: string
  }>(`admin_password_reset:${parsed.data.token}`)

  if (!payload?.auth_user_id) {
    return { error: 'This reset link is invalid or has expired' }
  }

  const supabase = createAdminClient()
  const { data: admin } = await supabase
    .from('admins')
    .select('id, is_active')
    .eq('id', payload.admin_id)
    .maybeSingle()

  if (!admin?.is_active) {
    await redis.del(`admin_password_reset:${parsed.data.token}`)
    return { error: 'This reset link is invalid or has expired' }
  }

  const { error } = await supabase.auth.admin.updateUserById(payload.auth_user_id, {
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Failed to reset password. Please try again.' }
  }

  await redis.del(`admin_password_reset:${parsed.data.token}`)
  await invalidateAllAuthSessions(payload.auth_user_id)

  await logAuditEvent({
    adminId: payload.admin_id,
    action: 'admin.password_reset_completed',
    entityType: 'admin',
    entityId: payload.admin_id,
  })

  redirect('/admin/login?reset=success')
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = adminChangePasswordSchema.safeParse({
    currentPassword,
    password: newPassword,
    confirmPassword,
  })

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message
    return { error: msg ?? 'Invalid input' }
  }

  const admin = await requireAdmin()
  const ip = await getClientIp()
  const { allowed } = await checkRateLimit(
    adminPasswordChangeLimit,
    `${admin.id}:${ip}`,
  )
  if (!allowed) {
    return { error: 'Too many attempts. Please try again later.' }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { error: 'Session expired. Please sign in again.' }
  }

  const attempt = await assertPasswordAttemptAllowed(user.email)
  if (!attempt.allowed) {
    return { error: 'Too many attempts. Please try again in a minute.' }
  }

  const { error: signInError } = await signInWithFreshSession(supabase, {
    email: user.email,
    password: parsed.data.currentPassword,
  })

  if (signInError) {
    return { error: 'Current password is incorrect' }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (updateError) {
    return { error: 'Failed to update password. Please try again.' }
  }

  await invalidateAllAuthSessions(user.id)

  await logAuditEvent({
    adminId: admin.id,
    action: 'admin.password_changed',
    entityType: 'admin',
    entityId: admin.id,
  })

  return { success: true }
}
