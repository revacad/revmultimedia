import Link from 'next/link'
import PortalLogoutButton from '@/components/portal/PortalLogoutButton'

interface PortalNavbarProps {
  displayName: string
}

export default function PortalNavbar({ displayName }: PortalNavbarProps) {
  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between border-b border-[#EFEFF5] bg-white px-8"
    >
      <Link href="/portal/application" className="inline-flex items-center gap-1">
        <span className="font-display text-xl font-bold text-[#C74A86]">Rev</span>
        <span className="font-display text-xl font-semibold text-[#1A1A2E]">Multimedia</span>
      </Link>
      <div className="flex items-center gap-4">
        <span className="font-body text-sm font-medium text-[#5A5A7A]">{displayName}</span>
        <PortalLogoutButton />
      </div>
    </header>
  )
}
