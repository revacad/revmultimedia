'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { adminLogout, logoutAllAdminDevices } from '@/actions/auth'
import AdminSearchBar from '@/components/admin/AdminSearchBar'
import { getAdminPageTitle } from '@/lib/admin/page-titles'

interface AdminTopBarProps {
  adminName: string
  onMenuClick?: () => void
}

export default function AdminTopBar({ adminName, onMenuClick }: AdminTopBarProps) {
  const pathname = usePathname()
  const title = getAdminPageTitle(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#EFEFF5] bg-white px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#1A1A2E] hover:bg-[#F7F8FC] lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        <p className="truncate font-display text-lg font-semibold text-[#1A1A2E]">{title}</p>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-4">
        <AdminSearchBar />
        <span className="hidden font-body text-sm text-[#5A5A7A] sm:inline">{adminName}</span>
        <form action={adminLogout} className="inline">
          <button
            type="submit"
            className="font-body text-sm font-semibold text-primary hover:text-[#9E3068]"
          >
            Sign out
          </button>
        </form>
        <form action={logoutAllAdminDevices} className="hidden sm:inline">
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
