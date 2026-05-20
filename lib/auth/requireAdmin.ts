import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminRecord = {
  id: string
  role: 'admin' | 'superadmin'
  full_name: string
  is_active: boolean
}

export async function requireAdmin(): Promise<AdminRecord> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admins')
    .select('id, role, full_name, is_active')
    .eq('auth_user_id', user.id)
    .single()

  if (!admin || !admin.is_active) redirect('/admin/login')

  return admin as AdminRecord
}

export async function requireSuperAdmin(): Promise<AdminRecord> {
  const admin = await requireAdmin()
  if (admin.role !== 'superadmin') redirect('/admin')
  return admin
}
