'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, User, type LucideIcon } from 'lucide-react'

const ITEMS: {
  href: string
  label: string
  Icon: LucideIcon
}[] = [
  { href: '/portal/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/portal/invoices', label: 'Invoices', Icon: Receipt },
  { href: '/portal/profile', label: 'Profile', Icon: User },
]

const DOCK_BAR_STYLE: React.CSSProperties = {
  width: 280,
  borderRadius: 40,
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '10px 20px',
}

export default function PortalMobileDock() {
  const pathname = usePathname()
  const activeIndex = Math.max(
    0,
    ITEMS.findIndex(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ),
  )

  return (
    <nav
      className="fixed left-1/2 z-50 block -translate-x-1/2 md:hidden"
      aria-label="Portal navigation"
      style={{
        bottom: 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 0px)))',
      }}
    >
      <div style={DOCK_BAR_STYLE}>
        {ITEMS.map((item, index) => {
          const active = index === activeIndex
          const { Icon } = item
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className="flex items-center justify-center p-1"
              style={{ color: active ? '#e63946' : 'rgba(0, 0, 0, 0.4)' }}
            >
              <Icon size={24} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
