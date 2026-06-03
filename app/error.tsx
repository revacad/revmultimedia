'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import GlobalErrorFallback from '@/components/ui/GlobalErrorFallback'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return <GlobalErrorFallback onRetry={reset} />
}
