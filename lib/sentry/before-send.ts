import type { ErrorEvent, EventHint } from '@sentry/nextjs'

const DROPPED_ERROR_PATTERNS = [
  'Failed to parse body as FormData',
  'Missing boundary in content-type header',
  'Connection closed.',
]

function eventMessages(event: ErrorEvent): string[] {
  const messages: string[] = []
  if (typeof event.message === 'string') {
    messages.push(event.message)
  }
  for (const value of event.exception?.values ?? []) {
    if (typeof value.value === 'string') {
      messages.push(value.value)
    }
  }
  return messages
}

function matchesDroppedPattern(message: string): boolean {
  return DROPPED_ERROR_PATTERNS.some((pattern) => message.includes(pattern))
}

function isDroppedNoise(event: ErrorEvent, hint: EventHint): boolean {
  if (eventMessages(event).some(matchesDroppedPattern)) {
    return true
  }

  const original = hint.originalException
  if (original instanceof Error) {
    return matchesDroppedPattern(original.message)
  }

  return false
}

/** Drop known bot/scanner and navigation-abort noise from Sentry. */
export function sentryBeforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  if (isDroppedNoise(event, hint)) {
    return null
  }
  return event
}
