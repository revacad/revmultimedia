'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { redis } from '@/lib/redis/client'
import { checkRateLimit, loginLimit, passwordResetLimit } from '@/lib/redis/ratelimit'
import { getClientIp } from '@/lib/auth/getClientIp'
import { sendPasswordReset } from '@/lib/notifications/email'

const STUDENT_ID_RE = /^REV\d{10}$/i

function portalBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const ip = await getClientIp()
  const { allowed } = await checkRateLimit(loginLimit, ip)
  if (!allowed) {
    return { error: 'Too many login attempts. Please try again later.' }
  }

  const supabase = await createServerClient()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (authError || !authData.user) {
    return { error: 'Invalid email or password' }
  }

  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('id, role, is_active')
    .eq('auth_user_id', authData.user.id)
    .single()

  if (adminError || !admin) {
    await supabase.auth.signOut()
    return { error: 'Invalid email or password' }
  }

  if (!admin.is_active) {
    await supabase.auth.signOut()
    return { error: 'This account has been deactivated.' }
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function adminLogout() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function portalLogin(
  identifier: string,
  password: string,
): Promise<{ error?: string }> {
  const ip = await getClientIp()
  const { allowed } = await checkRateLimit(loginLimit, ip)
  if (!allowed) {
    return { error: 'Too many login attempts. Please try again later.' }
  }

  const trimmed = identifier.trim().toUpperCase()
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
  const { error } = await supabase.auth.signInWithPassword({
    email: internalEmail,
    password,
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
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function logout() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset(
  identifier: string,
  email: string,
): Promise<{ message: string }> {
  const ip = await getClientIp()
  const { allowed } = await checkRateLimit(passwordResetLimit, ip)
  if (!allowed) {
    return {
      message:
        'If your details match our records, you will receive a reset link shortly.',
    }
  }

  const genericMessage =
    'If your details match our records, you will receive a reset link shortly.'

  const trimmedId = identifier.trim().toUpperCase()
  const trimmedEmail = email.trim().toLowerCase()
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
  } else {
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
  if (!token || newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  const payload = await redis.get<{ auth_user_id: string; identifier: string }>(
    `password_reset:${token}`,
  )

  if (!payload?.auth_user_id) {
    return { error: 'This reset link is invalid or has expired' }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(payload.auth_user_id, {
    password: newPassword,
  })

  if (error) {
    return { error: 'Failed to reset password. Please try again.' }
  }

  await redis.del(`password_reset:${token}`)
  redirect('/login?reset=success')
}
