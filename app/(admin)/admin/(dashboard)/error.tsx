'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import ErrorState from '@/components/ui/ErrorState'
import { capturePostHogException } from '@/lib/analytics/capture-posthog-exception'

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const posthog = usePostHog()

  useEffect(() => {
    Sentry.captureException(error)
    capturePostHogException(posthog, error)
  }, [error, posthog])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <ErrorState
        message="Something went wrong loading this page. Please try again."
        onRetry={reset}
        showWhatsApp={false}
      />
    </div>
  )
}
