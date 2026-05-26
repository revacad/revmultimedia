'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { redis } from '@/lib/redis/client'
import { invalidateAllAuthSessions } from '@/lib/auth/invalidate-sessions'
import { onLoginSuccess, signInWithFreshSession } from '@/lib/auth/login-session'
import { assertPasswordAttemptAllowed } from '@/lib/auth/password-attempts'
import { clearSessionBinding } from '@/lib/auth/session-binding'
import { checkRateLimit, passwordResetLimit } from '@/lib/redis/ratelimit'
import { getClientIp } from '@/lib/auth/getClientIp'
import { sendPasswordReset } from '@/lib/notifications/email'
import {
  adminLoginSchema,
  APPLICATION_REF_RE,
  portalLoginSchema,
  portalPasswordResetConfirmSchema,
  passwordResetRequestSchema,
  STUDENT_ID_RE,
} from '@/lib/validations/auth'

function portalBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const parsed = adminLoginSchema.safeParse({ email, password })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid login details' }
  }

  const attempt = await assertPasswordAttemptAllowed(parsed.data.email)
  if (!attempt.allowed) {
    return { error: 'Too many login attempts. Please try again in a minute.' }
  }

  const supabase = await createServerClient()

  const { data: authData, error: authError } = await signInWithFreshSession(supabase, {
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (authError || !authData.user) {
    return { error: 'Invalid email or password' }
  }

  const adminClient = createAdminClient()
  const { data: admin, error: adminError } = await adminClient
    .from('admins')
    .select('id, role, is_active')
    .eq('auth_user_id', authData.user.id)
    .single()

  if (adminError || !admin) {
    await supabase.auth.signOut({ scope: 'local' })
    return { error: 'Invalid email or password' }
  }

  if (!admin.is_active) {
    await supabase.auth.signOut({ scope: 'global' })
    return { error: 'This account has been deactivated.' }
  }

  const role = admin.role as 'admin' | 'superadmin'
  await adminClient.auth.admin.updateUserById(authData.user.id, {
    app_metadata: { role },
  })

  await onLoginSuccess(authData.user.id)
  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function adminLogout() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  await supabase.auth.signOut({ scope: 'global' })
  if (user) await clearSessionBinding(user.id)
  redirect('/admin/login')
}

export async function logoutAllDevices() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  await invalidateAllAuthSessions(user.id)
  redirect('/login?signed_out=all')
}

export async function logoutAllAdminDevices() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }
  await invalidateAllAuthSessions(user.id)
  redirect('/admin/login?signed_out=all')
}

export async function portalLogin(
  identifier: string,
  password: string,
): Promise<{ error?: string }> {
  const parsed = portalLoginSchema.safeParse({ identifier, password })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid login details' }
  }

  const attempt = await assertPasswordAttemptAllowed(parsed.data.identifier)
  if (!attempt.allowed) {
    return { error: 'Too many login attempts. Please try again in a minute.' }
  }

  const trimmed = parsed.data.identifier
  const admin = createAdminClient()

  let internalEmail: string | null = null

  if (STUDENT_ID_RE.test(trimmed)) {
    const { data: student } = await admin
      .from('students')
      .select('application_id, student_id')
      .eq('student_id', trimmed)
      .maybeSingle()

    if (student?.application_id) {
      const { data: application } = await admin
        .from('applications')
        .select('internal_email')
        .eq('id', student.application_id)
        .maybeSingle()

      internalEmail = application?.internal_email ?? null
    }
  } else {
    const { data: application } = await admin
      .from('applications')
      .select('internal_email')
      .eq('reference', trimmed)
      .maybeSingle()

    internalEmail = application?.internal_email ?? null
  }

  if (!internalEmail) {
    return { error: 'Invalid ID or password' }
  }

  const supabase = await createServerClient()
  const { error } = await signInWithFreshSession(supabase, {
    email: internalEmail,
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Invalid ID or password' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let redirectTo = '/portal/application'
  if (user) {
    const { data: student } = await admin
      .from('students')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (student) {
      redirectTo = '/portal/dashboard'
    }
    await onLoginSuccess(user.id)
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function logout() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  await supabase.auth.signOut({ scope: 'global' })
  if (user) await clearSessionBinding(user.id)
  redirect('/login')
}

export async function requestPasswordReset(
  identifier: string,
  email: string,
): Promise<{ message: string }> {
  const genericMessage =
    'If your details match our records, you will receive a reset link shortly.'

  const ip = await getClientIp()
  const { allowed } = await checkRateLimit(passwordResetLimit, ip)
  if (!allowed) {
    return { message: genericMessage }
  }

  const parsed = passwordResetRequestSchema.safeParse({ identifier, email })
  if (!parsed.success) {
    return { message: genericMessage }
  }

  const trimmedId = parsed.data.identifier
  const trimmedEmail = parsed.data.email
  const admin = createAdminClient()

  let authUserId: string | null = null
  let matchedIdentifier = trimmedId
  let recipientName: string | undefined

  if (STUDENT_ID_RE.test(trimmedId)) {
    const { data: student } = await admin
      .from('students')
      .select('auth_user_id, real_email, student_id, full_name')
      .eq('student_id', trimmedId)
      .maybeSingle()

    if (student && student.real_email.toLowerCase() === trimmedEmail) {
      authUserId = student.auth_user_id
      matchedIdentifier = student.student_id
      recipientName = student.full_name
    }
  } else if (APPLICATION_REF_RE.test(trimmedId)) {
    const { data: application } = await admin
      .from('applications')
      .select('auth_user_id, real_email, reference, full_name')
      .eq('reference', trimmedId)
      .maybeSingle()

    if (application && application.real_email.toLowerCase() === trimmedEmail) {
      authUserId = application.auth_user_id
      matchedIdentifier = application.reference
      recipientName = application.full_name
    }
  }

  if (!authUserId) {
    return { message: genericMessage }
  }

  const token = randomUUID()
  await redis.set(
    `password_reset:${token}`,
    { auth_user_id: authUserId, identifier: matchedIdentifier },
    { ex: 3600 },
  )

  const resetUrl = `${portalBaseUrl()}/reset-password?token=${token}`
  await sendPasswordReset(trimmedEmail, {
    resetUrl,
    name: recipientName,
  })

  return { message: genericMessage }
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<{ error?: string }> {
  const parsed = portalPasswordResetConfirmSchema.safeParse({
    token,
    password: newPassword,
  })
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Invalid password',
    }
  }

  const resetRecord = await redis.get<{ auth_user_id: string; identifier: string }>(
    `password_reset:${parsed.data.token}`,
  )

  if (!resetRecord?.auth_user_id) {
    return { error: 'This reset link is invalid or has expired' }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(resetRecord.auth_user_id, {
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Failed to reset password. Please try again.' }
  }

  await redis.del(`password_reset:${parsed.data.token}`)
  await invalidateAllAuthSessions(resetRecord.auth_user_id)
  redirect('/login?reset=success')
}
