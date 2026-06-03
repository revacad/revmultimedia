'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import GlobalErrorFallback from '@/components/ui/GlobalErrorFallback'

export default function RootGlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <GlobalErrorFallback />
      </body>
    </html>
  )
}
