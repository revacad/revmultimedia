import { headers } from 'next/headers'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopBar from '@/components/admin/AdminTopBar'
import { requireAdminPage } from '@/lib/auth/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = (await headers()).get('x-pathname') ?? ''
  const isAuthPage =
    pathname === '/admin/login' || pathname.startsWith('/admin/accept-invite')

  // Protect all admin routes except login / invite acceptance.
  if (!isAuthPage) {
    await requireAdminPage()
  }

  if (isAuthPage) {
    return <>{children}</>
  }

  const session = await getAdminSession()
  const supabase = createAdminClient()
  const { data: admin } = session
    ? await supabase
        .from('admins')
        .select('full_name, role')
        .eq('auth_user_id', session.userId)
        .maybeSingle()
    : { data: null }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        adminName={admin?.full_name ?? 'Admin'}
        adminRole={admin?.role ?? 'admin'}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <AdminTopBar adminName={admin?.full_name ?? 'Admin'} />
        <main className="flex-1 overflow-auto bg-[#F8F8FC] p-8">{children}</main>
      </div>
    </div>
  )
}
