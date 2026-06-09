'use client'

import type { PostHog } from 'posthog-js'

export function capturePostHogException(
  posthog: PostHog | null | undefined,
  error: Error & { digest?: string },
): void {
  posthog?.capture('$exception', {
    $exception_message: error.message,
    $exception_type: error.name,
    $exception_stack: error.stack,
  })
}
