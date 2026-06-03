'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import PortalLogoutButton from '@/components/portal/PortalLogoutButton'
import { getPortalSectionLabel } from '@/lib/portal/nav-sections'

interface PortalNavbarProps {
  displayName: string
}

export default function PortalNavbar({ displayName }: PortalNavbarProps) {
  const pathname = usePathname()
  const sectionLabel = getPortalSectionLabel(pathname)

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-[#EFEFF5] bg-white px-4 sm:h-16 sm:px-6">
      <Link
        href="/portal/dashboard"
        prefetch={false}
        className="inline-flex shrink-0 items-center gap-1 md:min-w-[120px]"
      >
        <span className="font-display text-lg font-bold text-[#C74A86] sm:text-xl">Rev</span>
        <span className="hidden font-display text-lg font-semibold text-[#1A1A2E] sm:inline sm:text-xl">
          Multimedia
        </span>
      </Link>

      <p className="absolute left-1/2 -translate-x-1/2 font-body text-sm font-bold text-[#1A1A2E] md:hidden">
        {sectionLabel}
      </p>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4 md:min-w-[120px] md:justify-end">
        <span className="hidden font-body text-sm font-medium text-[#5A5A7A] sm:inline">
          {displayName}
        </span>
        <PortalLogoutButton />
      </div>
    </header>
  )
}
