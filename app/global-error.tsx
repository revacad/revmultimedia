'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import GlobalErrorFallback from '@/components/ui/GlobalErrorFallback'
import { capturePostHogException } from '@/lib/analytics/capture-posthog-exception'

export default function RootGlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
    capturePostHogException(posthog, error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <GlobalErrorFallback />
      </body>
    </html>
  )
}
