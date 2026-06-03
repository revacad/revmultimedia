'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import PortalErrorState from '@/components/portal/PortalErrorState'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center py-8">
      <PortalErrorState
        message="We could not load this page. This is usually a connection issue."
        onRetry={reset}
      />
    </div>
  )
}
