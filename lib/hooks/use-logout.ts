'use client'

import { usePostHog } from 'posthog-js/react'
import { logout, logoutAllDevices } from '@/actions/auth'

export function useLogout() {
  const posthog = usePostHog()

  const resetAnalytics = () => {
    posthog?.reset()
  }

  const signOut = async (action: () => Promise<void>) => {
    resetAnalytics()
    await action()
  }

  return {
    logout: () => signOut(logout),
    logoutAllDevices: () => signOut(logoutAllDevices),
  }
}

export function usePostHogReset() {
  const posthog = usePostHog()

  return () => {
    posthog?.reset()
  }
}
