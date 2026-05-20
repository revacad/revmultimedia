'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PortalSecondaryNavProps {
  isStudent: boolean
}

const applicantLinks = [
  { href: '/portal/application', label: 'Application' },
  { href: '/portal/documents', label: 'Documents' },
] as const

const studentLinks = [
  { href: '/portal/dashboard', label: 'Dashboard' },
  { href: '/portal/documents', label: 'Documents' },
  { href: '/portal/invoices', label: 'Invoices' },
] as const

export default function PortalSecondaryNav({ isStudent }: PortalSecondaryNavProps) {
  const pathname = usePathname()
  const links = isStudent ? studentLinks : applicantLinks

  return (
    <nav className="border-b border-[#EFEFF5] bg-white px-8">
      <div className="flex gap-6">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'inline-block border-b-2 py-4 font-body text-sm transition-colors',
                active
                  ? 'border-[#C74A86] font-semibold text-[#C74A86]'
                  : 'border-transparent text-[#5A5A7A] hover:text-[#1A1A2E]',
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
