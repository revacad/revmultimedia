'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { buttonVariants } from '@/components/ui/Button'
import { SearchBar } from '@/components/public/SearchBar'
import { cn } from '@/lib/utils'

function LogoDots() {
  const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-primary']
  return (
    <div className="mr-2.5 grid grid-cols-2 gap-1">
      {colors.map((c, i) => (
        <span key={i} className={cn('h-2 w-2 rounded-full', c)} />
      ))}
    </div>
  )
}

function BellIcon() {
  return (
    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="flex h-[72px] min-w-0 items-center gap-3 px-4 sm:gap-4 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center">
            <LogoDots />
            <span className="font-display text-xl font-bold text-primary">Rev</span>
            <span className="hidden font-display text-xl font-semibold text-dark sm:inline">
              Multimedia
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 md:flex xl:gap-6">
            <nav className="flex items-center gap-1 lg:gap-2" aria-label="Main navigation">
              {NAV_LINKS.map((link) => {
                const active =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname === link.href || pathname.startsWith(`${link.href}/`)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'whitespace-nowrap rounded-full px-3 py-2 text-[15px] font-medium transition-colors',
                      active
                        ? 'bg-primary-light text-primary'
                        : 'text-gray-600 hover:bg-surface-2 hover:text-dark',
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            <SearchBar />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="hidden rounded-full p-2 transition-colors hover:bg-surface-2 lg:block"
              aria-label="Notifications"
            >
              <BellIcon />
            </button>
            <Link
              href="/apply"
              className={cn(
                buttonVariants({ variant: 'primary', size: 'sm' }),
                'inline-flex px-4 py-2 text-[13px] md:hidden',
              )}
            >
              Apply Now
            </Link>
            <Link
              href="/apply"
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'hidden md:inline-flex')}
            >
              Apply Now
            </Link>
            <button
              type="button"
              className="rounded-lg p-2 text-dark md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-white p-6 md:hidden">
          <button
            type="button"
            className="absolute top-6 right-6 z-10 rounded-full p-2 text-dark hover:bg-surface-2"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display text-[28px] text-dark transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/apply"
            className={buttonVariants({ variant: 'primary', size: 'md' })}
            onClick={() => setMobileMenuOpen(false)}
          >
            Apply Now
          </Link>
        </div>
      )}
    </>
  )
}
