'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import GlobalErrorFallback from '@/components/ui/GlobalErrorFallback'
import { capturePostHogException } from '@/lib/analytics/capture-posthog-exception'

export default function GlobalError({
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

  return <GlobalErrorFallback onRetry={reset} />
}
