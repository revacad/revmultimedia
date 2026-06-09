import AdminDashboardShell from '@/components/admin/AdminDashboardShell'
import AdminLayoutShell from '@/components/admin/AdminLayoutShell'
import { PostHogIdentify } from '@/components/auth/PostHogIdentify'
import { requireAdminPage } from '@/lib/auth/guard'
import { enforceAdminRouteAccess } from '@/lib/auth/requireAdmin'
import { getAdminNavItems } from '@/lib/admin/nav'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/auth/admin'
import type { AdminRole } from '@/lib/auth/admin'

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
  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()
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
      {user ? (
        <PostHogIdentify
          userId={user.id}
          email={user.email ?? ''}
          name={admin?.full_name ?? 'Admin'}
          role={adminRole as AdminRole}
        />
      ) : null}
      <AdminDashboardShell adminName={admin?.full_name ?? 'Admin'} adminRole={adminRole}>
        {children}
      </AdminDashboardShell>
    </AdminLayoutShell>
  )
}
