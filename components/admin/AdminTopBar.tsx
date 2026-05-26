'use client'

import { usePathname } from 'next/navigation'
import { adminLogout, logoutAllAdminDevices } from '@/actions/auth'
import AdminSearchBar from '@/components/admin/AdminSearchBar'
import { getAdminPageTitle } from '@/lib/admin/page-titles'

interface AdminTopBarProps {
  adminName: string
}

export default function AdminTopBar({ adminName }: AdminTopBarProps) {
  const pathname = usePathname()
  const title = getAdminPageTitle(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#EFEFF5] bg-white px-8">
      <p className="font-display text-lg font-semibold text-[#1A1A2E]">{title}</p>
      <div className="flex flex-1 items-center justify-end gap-4">
        <AdminSearchBar />
        <span className="font-body text-sm text-[#5A5A7A]">{adminName}</span>
        <form action={adminLogout} className="inline">
          <button
            type="submit"
            className="font-body text-sm font-semibold text-primary hover:text-[#9E3068]"
          >
            Sign out
          </button>
        </form>
        <form action={logoutAllAdminDevices} className="inline">
          <button
            type="submit"
            title="Revoke sessions on all devices"
            className="font-body text-xs text-[#9898B8] hover:text-[#5A5A7A]"
          >
            All devices
          </button>
        </form>
      </div>
    </header>
  )
}
