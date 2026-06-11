'use client'

import { useState, type ReactNode } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopBar from '@/components/admin/AdminTopBar'
import type { AdminRole } from '@/lib/auth/admin'

interface AdminDashboardShellProps {
  adminName: string
  adminRole: AdminRole
  unreadApplicationsCount?: number
  children: ReactNode
}

export default function AdminDashboardShell({
  adminName,
  adminRole,
  unreadApplicationsCount = 0,
  children,
}: AdminDashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function closeSidebar() {
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-[#1A1A2E]/60 lg:hidden"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
        />
      ) : null}

      <AdminSidebar
        adminName={adminName}
        adminRole={adminRole}
        unreadApplicationsCount={unreadApplicationsCount}
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
        onNavigate={closeSidebar}
      />

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <AdminTopBar adminName={adminName} onMenuClick={() => setSidebarOpen(true)} />
        <main className="scrollbar-hidden flex-1 overflow-auto bg-[#F8F8FC] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
