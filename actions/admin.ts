'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAdminInvite } from '@/lib/notifications/email'
import { createServerClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/log'
import { requireAdmin as requireAdminSession } from '@/lib/auth/admin'
import { inviteAdminSchema } from '@/lib/validations/admin'
import {
  acceptAdminInviteSchema,
  adminIdActivateSchema,
  adminInviteIdSchema,
  validateAdminInviteTokenSchema,
} from '@/lib/validations/admin-actions'

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000'
  )
}

async function requireSuperAdminAction(): Promise<{
  adminId: string
  userId: string
}> {
  const session = await requireAdminSession()
  if (session.role !== 'superadmin') {
    throw new Error('Only superadmins can perform this action')
  }
  return { adminId: session.adminId, userId: session.userId }
}

export async function inviteAdmin(data: {
  fullName: string
  email: string
  role: 'admin' | 'superadmin'
}): Promise<{ error?: string; success?: boolean }> {
  let callerAdminId: string

  try {
    const session = await requireSuperAdminAction()
    callerAdminId = session.adminId
  } catch {
    return { error: 'Only superadmins can invite admins' }
  }

  const parsed = inviteAdminSchema.safeParse(data)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Invalid invite details',
    }
  }

  const payload = parsed.data
  const supabase = createAdminClient()
  const email = payload.email
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48)

  const { error } = await supabase.from('admin_invites').insert({
    email,
    full_name: payload.fullName,
    role: payload.role,
    token,
    invited_by: callerAdminId,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'An invite already exists for this email' }
    }
    return { error: 'Failed to create invite' }
  }

  const { data: inviter } = await supabase
    .from('admins')
    .select('full_name')
    .eq('id', callerAdminId)
    .single()

  const inviteUrl = `${appBaseUrl()}/admin/accept-invite?token=${token}`
  await sendAdminInvite(email, {
    fullName: payload.fullName,
    role: payload.role,
    inviteUrl,
    invitedBy: inviter?.full_name ?? 'Rev Multimedia',
  })

  await logAuditEvent({
    adminId: callerAdminId,
    action: 'admin.invited',
    entityType: 'admin_invite',
    newValue: { email, role: payload.role },
  })

  revalidatePath('/admin/admins')
  return { success: true }
}

export async function resendAdminInvite(
  inviteId: string,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = adminInviteIdSchema.safeParse({ inviteId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid invite id' }
  }

  let callerAdminId: string

  try {
    const session = await requireSuperAdminAction()
    callerAdminId = session.adminId
  } catch {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()
  const { data: invite } = await supabase
    .from('admin_invites')
    .select('*')
    .eq('id', parsed.data.inviteId)
    .eq('used', false)
    .single()

  if (!invite) {
    return { error: 'Invite not found' }
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48)

  const { error } = await supabase
    .from('admin_invites')
    .update({ token, expires_at: expiresAt.toISOString() })
    .eq('id', parsed.data.inviteId)

  if (error) {
    return { error: 'Failed to refresh invite' }
  }

  const { data: inviter } = await supabase
    .from('admins')
    .select('full_name')
    .eq('id', callerAdminId)
    .single()

  const inviteUrl = `${appBaseUrl()}/admin/accept-invite?token=${token}`
  await sendAdminInvite(invite.email, {
    fullName: invite.full_name,
    role: invite.role,
    inviteUrl,
    invitedBy: inviter?.full_name ?? 'Rev Multimedia',
    resent: true,
  })

  await logAuditEvent({
    adminId: callerAdminId,
    action: 'admin.invite_resent',
    entityType: 'admin_invite',
    entityId: parsed.data.inviteId,
    newValue: { email: invite.email },
  })

  revalidatePath('/admin/admins')
  return { success: true }
}

export async function cancelAdminInvite(
  inviteId: string,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = adminInviteIdSchema.safeParse({ inviteId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid invite id' }
  }

  let callerAdminId: string

  try {
    const session = await requireSuperAdminAction()
    callerAdminId = session.adminId
  } catch {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()
  const { data: invite } = await supabase
    .from('admin_invites')
    .select('email')
    .eq('id', parsed.data.inviteId)
    .single()

  const { error } = await supabase.from('admin_invites').delete().eq('id', parsed.data.inviteId)

  if (error) {
    return { error: 'Failed to cancel invite' }
  }

  await logAuditEvent({
    adminId: callerAdminId,
    action: 'admin.invite_cancelled',
    entityType: 'admin_invite',
    entityId: parsed.data.inviteId,
    oldValue: invite ? { email: invite.email } : undefined,
  })

  revalidatePath('/admin/admins')
  return { success: true }
}

export async function toggleAdminActive(
  adminId: string,
  activate: boolean,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = adminIdActivateSchema.safeParse({ adminId, activate })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid request' }
  }

  let callerAdminId: string

  try {
    const session = await requireSuperAdminAction()
    callerAdminId = session.adminId
  } catch {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()
  const { data: target } = await supabase
    .from('admins')
    .select('id, role, email, is_active')
    .eq('id', parsed.data.adminId)
    .single()

  if (!target) {
    return { error: 'Admin not found' }
  }

  if (target.role === 'superadmin' && !activate) {
    return { error: 'Superadmin accounts cannot be deactivated' }
  }

  const { error } = await supabase
    .from('admins')
    .update({ is_active: parsed.data.activate })
    .eq('id', parsed.data.adminId)

  if (error) {
    return { error: 'Failed to update admin' }
  }

  await logAuditEvent({
    adminId: callerAdminId,
    action: parsed.data.activate ? 'admin.reactivated' : 'admin.deactivated',
    entityType: 'admin',
    entityId: parsed.data.adminId,
    oldValue: { is_active: target.is_active },
    newValue: { is_active: parsed.data.activate, email: target.email },
  })

  revalidatePath('/admin/admins')
  return { success: true }
}

export async function acceptAdminInvite(
  token: string,
  password: string,
): Promise<{ error?: string }> {
  const parsed = acceptAdminInviteSchema.safeParse({ token, password })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid invitation details' }
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: invite } = await supabase
    .from('admin_invites')
    .select('*')
    .eq('token', parsed.data.token)
    .eq('used', false)
    .gt('expires_at', now)
    .single()

  if (!invite) {
    return { error: 'Invalid or expired invitation' }
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: invite.email,
    password: parsed.data.password,
    email_confirm: true,
    app_metadata: { role: invite.role },
  })

  if (authError || !authUser.user) {
    return { error: 'Failed to create account' }
  }

  const { error: adminError } = await supabase.from('admins').insert({
    auth_user_id: authUser.user.id,
    full_name: invite.full_name,
    email: invite.email,
    role: invite.role,
    is_active: true,
    created_by: invite.invited_by,
  })

  if (adminError) {
    await supabase.auth.admin.deleteUser(authUser.user.id)
    return { error: 'Failed to create admin profile' }
  }

  await supabase.from('admin_invites').update({ used: true }).eq('id', invite.id)

  await logAuditEvent({
    action: 'admin.created',
    entityType: 'admin',
    newValue: { email: invite.email, role: invite.role },
  })

  redirect('/admin/login?message=Account created. Please sign in.')
}

export async function validateAdminInviteToken(
  token: string,
): Promise<{ valid: boolean; fullName?: string }> {
  const parsed = validateAdminInviteTokenSchema.safeParse({ token })
  if (!parsed.success) return { valid: false }

  const supabase = createAdminClient()
  const { data: invite } = await supabase
    .from('admin_invites')
    .select('full_name')
    .eq('token', parsed.data.token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!invite) return { valid: false }
  return { valid: true, fullName: invite.full_name }
}
