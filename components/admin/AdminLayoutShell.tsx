'use client'

import type { ReactNode } from 'react'
import AdminCommandPalette from '@/components/admin/AdminCommandPalette'
import type { AdminNavItem } from '@/lib/admin/nav'

interface AdminLayoutShellProps {
  navItems: AdminNavItem[]
  children: ReactNode
}

export default function AdminLayoutShell({ navItems, children }: AdminLayoutShellProps) {
  return (
    <>
      <AdminCommandPalette items={navItems} />
      {children}
    </>
  )
}
