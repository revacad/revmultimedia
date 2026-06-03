'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getPortalSectionLabel, PORTAL_SECTIONS } from '@/lib/portal/nav-sections'
import { cn } from '@/lib/utils'

export default function PortalSecondaryNav() {
  const pathname = usePathname()
  const sectionLabel = getPortalSectionLabel(pathname)

  return (
    <div className="hidden bg-white md:block">
      <nav aria-label="Portal sections" className="border-b border-[#EFEFF5]">
        <div className="mx-auto flex max-w-[900px] gap-6 px-4 sm:px-6">
          {PORTAL_SECTIONS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={cn(
                  'inline-block border-b-2 py-4 font-body text-sm transition-colors',
                  active
                    ? 'border-[#e63946] font-semibold text-[#C74A86]'
                    : 'border-transparent text-[#5A5A7A] hover:text-[#1A1A2E]',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>
      <nav aria-label="breadcrumb" className="border-b border-[#EFEFF5] bg-[#FAFAFC]">
        <div className="mx-auto max-w-[900px] px-4 py-2 sm:px-6">
          <ol className="flex items-center gap-1.5 font-body text-xs text-[#9898B8]">
            <li>Portal</li>
            <li aria-hidden="true">/</li>
            <li className="text-[#5A5A7A]" aria-current="page">
              {sectionLabel}
            </li>
          </ol>
        </div>
      </nav>
    </div>
  )
}
