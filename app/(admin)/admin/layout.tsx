import { headers } from 'next/headers'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { requireAdminPage } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = (await headers()).get('x-pathname') ?? ''
  const isLoginPage = pathname === '/admin/login'

  if (!isLoginPage) {
    await requireAdminPage()
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-[#EFEFF5] bg-white px-8">
          <p className="font-body text-sm font-medium text-[#5A5A7A]">Admin Dashboard</p>
        </header>
        <main className="flex-1 overflow-auto bg-[#F8F8FC] p-8">{children}</main>
      </div>
    </div>
  )
}
