'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import PortalErrorState from '@/components/portal/PortalErrorState'
import { capturePostHogException } from '@/lib/analytics/capture-posthog-exception'

export default function PortalError({
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
    <div className="flex min-h-[50vh] items-center justify-center py-8">
      <PortalErrorState
        message="We could not load this page. This is usually a connection issue."
        onRetry={reset}
      />
    </div>
  )
}
