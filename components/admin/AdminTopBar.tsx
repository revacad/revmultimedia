'use client'

import { usePathname } from 'next/navigation'
import { adminLogout } from '@/actions/auth'
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
      <div className="flex items-center gap-4">
        <span className="font-body text-sm text-[#5A5A7A]">{adminName}</span>
        <form action={adminLogout}>
          <button
            type="submit"
            className="font-body text-sm font-semibold text-primary hover:text-[#9E3068]"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}
