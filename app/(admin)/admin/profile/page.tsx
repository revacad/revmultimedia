import AdminProfilePageClient from '@/components/admin/profile/AdminProfilePageClient'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Profile — Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminProfilePage() {
  const admin = await requireAdmin()
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminClient = createAdminClient()
  const { data: row } = await adminClient
    .from('admins')
    .select('email, full_name, role')
    .eq('id', admin.id)
    .single()

  return (
    <AdminProfilePageClient
      fullName={row?.full_name ?? admin.full_name}
      email={row?.email ?? user?.email ?? ''}
      role={row?.role ?? admin.role}
    />
  )
}
