'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { adminLogout } from '@/actions/auth'
import { cn } from '@/lib/utils'
import type { AdminRole } from '@/lib/auth/admin'
import { filterGroupsForRole, type NavIconName } from '@/lib/admin/nav'
import { useKeyboardShortcutLabel } from '@/lib/hooks/use-keyboard-shortcut-label'

function NavIcon({ name }: { name: NavIconName }) {
  if (name === 'shield') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )
  }
  if (name === 'audit') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  }
  if (name === 'log') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 10h16M4 14h10M4 18h6" />
      </svg>
    )
  }
  if (name === 'dashboard') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  }
  if (name === 'folder') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    )
  }
  if (name === 'comms') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  }
  if (name === 'chart') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  }
  if (name === 'files') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }
  if (name === 'users') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  }
  if (name === 'payments') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  }
  if (name === 'layers') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  }
  if (name === 'calendar') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }
  if (name === 'tag') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    )
  }
  if (name === 'settings') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
  if (name === 'compliance') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

interface AdminSidebarProps {
  adminName: string
  adminRole: AdminRole
  mobileOpen?: boolean
  onClose?: () => void
  onNavigate?: () => void
}

export default function AdminSidebar({
  adminName,
  adminRole,
  mobileOpen = false,
  onClose,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const groups = filterGroupsForRole(adminRole)
  const shortcutLabel = useKeyboardShortcutLabel()

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside
      className={cn(
        'flex h-full w-64 shrink-0 flex-col border-r border-white/8 bg-[#1A1A2E] p-6',
        'fixed bottom-0 left-0 top-0 z-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link href="/admin" className="block min-w-0" onClick={onNavigate}>
            <span className="font-display text-xl font-bold text-primary">Rev</span>
            <span className="font-display text-xl font-semibold text-white"> Admin</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white/60"
              title="Open command palette"
            >
              {shortcutLabel}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
        <nav className="space-y-6 pb-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 font-body text-[10px] font-semibold uppercase tracking-wider text-white/35">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'border-l-2 border-primary bg-primary/10 text-white'
                          : 'text-white/60 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <NavIcon name={link.icon} />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-3 shrink-0 border-t border-white/10 pt-3">
        <Link
          href="/admin/profile"
          onClick={onNavigate}
          className={cn(
            'flex h-12 items-center gap-2.5 rounded-lg px-2.5 transition-colors',
            pathname === '/admin/profile'
              ? 'bg-primary/15 text-white'
              : 'bg-white/5 text-white hover:bg-white/10',
          )}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 font-body text-[11px] font-bold uppercase text-primary"
            aria-hidden
          >
            {adminName.trim().charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-[13px] font-semibold leading-tight text-white">
              {adminName}
            </p>
            <p className="truncate font-body text-[11px] capitalize leading-tight text-white/55">
              {adminRole}
            </p>
          </div>
          <svg
            className="h-3.5 w-3.5 shrink-0 text-white/55"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <form action={adminLogout} className="mt-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2 font-body text-[13px] font-semibold text-[#e63946] transition-colors hover:bg-white/5"
          >
            <svg
              className="h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
              <path d="M9 12h12l-3 -3" />
              <path d="M18 15l3 -3" />
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
