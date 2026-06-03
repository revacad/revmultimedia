'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import ErrorState from '@/components/ui/ErrorState'

export default function AdminDashboardError({
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
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <ErrorState
        message="Something went wrong loading this page. Please try again."
        onRetry={reset}
        showWhatsApp={false}
      />
    </div>
  )
}
