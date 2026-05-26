/**
 * Restrict open redirects to same-origin portal paths.
 */
export function sanitizeRedirectPath(
  raw: string | null | undefined,
  fallback = '/portal/application',
): string {
  if (!raw) return fallback
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/portal') || trimmed.startsWith('//')) {
    return fallback
  }
  if (trimmed.includes('\\') || trimmed.includes('\0')) {
    return fallback
  }
  return trimmed.slice(0, 512)
}
