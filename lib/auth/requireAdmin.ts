import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession, type AdminRole } from '@/lib/auth/admin'
import { canAccessAdminPath, hasFinanceAccess, isStaffAdmin } from '@/lib/auth/permissions'

export type AdminRecord = {
  id: string
  role: AdminRole
  full_name: string
  is_active: boolean
}

export async function requireAdmin(): Promise<AdminRecord> {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const adminClient = createAdminClient()
  const { data: admin, error } = await adminClient
    .from('admins')
    .select('id, role, full_name, is_active')
    .eq('auth_user_id', session.userId)
    .single()

  if (error) {
    console.error('[auth] requireAdmin profile lookup failed', error.message)
    return {
      id: session.adminId,
      role: session.role,
      full_name: 'Admin',
      is_active: true,
    }
  }

  if (!admin || !admin.is_active) {
    redirect('/admin/login')
  }

  return admin as AdminRecord
}

export async function requireStaffAdmin(): Promise<AdminRecord> {
  const admin = await requireAdmin()
  if (!isStaffAdmin(admin.role)) redirect('/admin')
  return admin
}

export async function requireFinanceAccess(): Promise<AdminRecord> {
  const admin = await requireAdmin()
  if (!hasFinanceAccess(admin.role)) redirect('/admin')
  return admin
}

export async function requireSuperAdmin(): Promise<AdminRecord> {
  const admin = await requireAdmin()
  if (admin.role !== 'superadmin') redirect('/admin')
  return admin
}

/** Redirect accounts users away from routes they cannot access. */
export async function enforceAdminRouteAccess(): Promise<AdminRecord> {
  const admin = await requireAdmin()
  const headerStore = await headers()
  const pathname = headerStore.get('x-pathname') ?? '/admin'
  if (!canAccessAdminPath(admin.role, pathname)) {
    redirect('/admin')
  }
  return admin
}
