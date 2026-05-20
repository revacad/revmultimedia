import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminRole = 'admin' | 'superadmin'

export async function getAdminSession(): Promise<{
  userId: string
  adminId: string
  role: AdminRole
} | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admins')
    .select('id, role, is_active')
    .eq('auth_user_id', user.id)
    .single()

  if (!admin || !admin.is_active) return null
  if (admin.role !== 'admin' && admin.role !== 'superadmin') return null

  return { userId: user.id, adminId: admin.id, role: admin.role as AdminRole }
}

/** For server actions — throws instead of redirecting. */
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
