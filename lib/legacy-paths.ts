/** Old funnel / builder URLs (pre-2026 site). Return 404 so Google drops them. */
const LEGACY_EXACT = new Set([
  '/book',
  '/disqualified',
  '/thanks',
  '/opt-in',
])

const LEGACY_PREFIXES = ['/tmp/']

export function isLegacyMarketingPath(pathname: string): boolean {
  if (LEGACY_EXACT.has(pathname)) return true
  return LEGACY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
