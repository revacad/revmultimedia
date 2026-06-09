'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

interface PostHogIdentifyProps {
  userId: string
  email: string
  name?: string
  role?: 'student' | 'admin' | 'superadmin' | 'accounts'
  studentId?: string
}

export function PostHogIdentify({
  userId,
  email,
  name,
  role,
  studentId,
}: PostHogIdentifyProps) {
  const posthog = usePostHog()

  useEffect(() => {
    if (posthog && userId) {
      posthog.identify(userId, {
        email,
        name,
        role,
        studentId,
      })
    }
  }, [posthog, userId, email, name, role, studentId])

  return null
}
