import Link from 'next/link'
import PortalLogoutButton from '@/components/portal/PortalLogoutButton'

interface PortalNavbarProps {
  displayName: string
}

export default function PortalNavbar({ displayName }: PortalNavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#EFEFF5] bg-white px-4 sm:h-16 sm:px-8">
      <Link href="/portal/application" className="inline-flex shrink-0 items-center gap-1">
        <span className="font-display text-lg font-bold text-[#C74A86] sm:text-xl">Rev</span>
        <span className="hidden font-display text-lg font-semibold text-[#1A1A2E] sm:inline sm:text-xl">
          Multimedia
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <span className="hidden font-body text-sm font-medium text-[#5A5A7A] sm:inline">
          {displayName}
        </span>
        <PortalLogoutButton />
      </div>
    </header>
  )
}
