/** Strip a public R2 URL down to the object key if legacy rows stored full URLs. */
export function normalizeR2ObjectKey(stored: string): string {
  const trimmed = stored.trim()
  if (!trimmed) return trimmed
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed
  }
  try {
    const url = new URL(trimmed)
    return url.pathname.replace(/^\/+/, '')
  } catch {
    return trimmed
  }
}

export function parseR2KeyQueryParam(raw: string | null | undefined): string | null {
  if (!raw) return null
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  const key = normalizeR2ObjectKey(decoded)
  if (!key || key.length > 512) return null
  if (key.includes('..') || key.includes('\\') || key.startsWith('/')) return null
  return key
}
