import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasFinanceAccess, isStaffAdmin } from '@/lib/auth/permissions'

export type AdminRole = 'admin' | 'superadmin' | 'accounts'

const VALID_ROLES: AdminRole[] = ['admin', 'superadmin', 'accounts']

function isValidAdminRole(role: string): role is AdminRole {
  return VALID_ROLES.includes(role as AdminRole)
}

export async function getAdminSession(): Promise<{
  userId: string
  adminId: string
  role: AdminRole
} | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('[auth] getUser failed', authError.message)
    return null
  }
  if (!user) return null

  const adminClient = createAdminClient()
  const { data: admin, error } = await adminClient
    .from('admins')
    .select('id, role, is_active')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[auth] admin profile lookup failed', error.message, {
      authUserId: user.id,
    })
    return null
  }

  if (!admin || !admin.is_active) {
    console.error('[auth] no active admin row for user', { authUserId: user.id })
    return null
  }
  if (!isValidAdminRole(admin.role)) return null

  return { userId: user.id, adminId: admin.id, role: admin.role }
}

/** Any active admin (including accounts). */
export async function requireAdmin(): Promise<{
  userId: string
  adminId: string
  role: AdminRole
}> {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

/** Admin or superadmin only — blocks accounts role. */
export async function requireStaffAdmin(): Promise<{
  userId: string
  adminId: string
  role: AdminRole
}> {
  const session = await requireAdmin()
  if (!isStaffAdmin(session.role)) {
    throw new Error('Unauthorized')
  }
  return session
}

/** Finance routes: admin, superadmin, or accounts. */
export async function requireFinanceAccess(): Promise<{
  userId: string
  adminId: string
  role: AdminRole
}> {
  const session = await requireAdmin()
  if (!hasFinanceAccess(session.role)) {
    throw new Error('Unauthorized')
  }
  return session
}
