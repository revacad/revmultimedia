const NETWORK_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'])

const NETWORK_MESSAGE_FRAGMENTS = [
  'fetch failed',
  'network',
  'connecttimeout',
  'connection timed out',
  'socket hang up',
  'failed to fetch',
]

export function isNetworkError(error: unknown): boolean {
  if (!error) return false

  if (typeof error === 'object' && error !== null) {
    const code = (error as { code?: string }).code
    if (code && NETWORK_CODES.has(code)) return true

    const cause = (error as { cause?: unknown }).cause
    if (cause && cause !== error && isNetworkError(cause)) return true
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ''

  const normalized = message.toLowerCase()
  return NETWORK_MESSAGE_FRAGMENTS.some((fragment) => normalized.includes(fragment))
}

export function networkErrorMessage(): string {
  return 'Connection issue. Please check your internet and try again.'
}

export function defaultLoadErrorMessage(): string {
  return 'We could not load this data. Please refresh the page.'
}

export function errorDetail(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error'
  }
}
