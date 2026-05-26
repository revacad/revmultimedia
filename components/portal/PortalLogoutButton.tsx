'use client'

import { useTransition } from 'react'
import { logout, logoutAllDevices } from '@/actions/auth'

export default function PortalLogoutButton() {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => logout())}
        className="rounded-full border border-[#D8D8E8] px-4 py-2 font-body text-sm font-semibold text-[#5A5A7A] transition-colors hover:border-[#C74A86] hover:text-[#C74A86] disabled:opacity-50"
      >
        {pending ? 'Signing out…' : 'Log out'}
      </button>
      <button
        type="button"
        disabled={pending}
        title="Sign out on all browsers and devices"
        onClick={() => startTransition(() => logoutAllDevices())}
        className="hidden rounded-full border border-[#D8D8E8] px-3 py-2 font-body text-xs font-medium text-[#9898B8] transition-colors hover:border-[#C74A86] hover:text-[#C74A86] disabled:opacity-50 sm:inline"
      >
        All devices
      </button>
    </div>
  )
}
