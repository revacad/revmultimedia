import type { ErrorEvent, EventHint } from '@sentry/nextjs'

const MALFORMED_MULTIPART_PATTERNS = [
  'Failed to parse body as FormData',
  'Missing boundary in content-type header',
]

function eventMessage(event: ErrorEvent): string {
  const fromException = event.exception?.values?.[0]?.value
  if (typeof fromException === 'string') return fromException
  if (typeof event.message === 'string') return event.message
  return ''
}

function isMalformedMultipartError(message: string, hint: EventHint): boolean {
  if (MALFORMED_MULTIPART_PATTERNS.some((pattern) => message.includes(pattern))) {
    return true
  }

  const original = hint.originalException
  if (original instanceof Error) {
    return MALFORMED_MULTIPART_PATTERNS.some((pattern) => original.message.includes(pattern))
  }

  return false
}

/** Drop known bot/scanner noise from Sentry while keeping real upload failures. */
export function sentryBeforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  if (isMalformedMultipartError(eventMessage(event), hint)) {
    return null
  }
  return event
}
