import AdminDashboardShell from '@/components/admin/AdminDashboardShell'
import AdminLayoutShell from '@/components/admin/AdminLayoutShell'
import { requireAdminPage } from '@/lib/auth/guard'
import { enforceAdminRouteAccess } from '@/lib/auth/requireAdmin'
import { getAdminNavItems } from '@/lib/admin/nav'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdminPage()
  const adminRecord = await enforceAdminRouteAccess()

  const session = await getAdminSession()
  const supabase = createAdminClient()
  const { data: admin } = session
    ? await supabase
        .from('admins')
        .select('full_name, role')
        .eq('auth_user_id', session.userId)
        .maybeSingle()
    : { data: null }

  const adminRole = admin?.role ?? adminRecord.role
  const navItems = getAdminNavItems(adminRole)

  return (
    <AdminLayoutShell navItems={navItems}>
      <AdminDashboardShell adminName={admin?.full_name ?? 'Admin'} adminRole={adminRole}>
        {children}
      </AdminDashboardShell>
    </AdminLayoutShell>
  )
}
