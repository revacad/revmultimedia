/**
 * Server-safe HTML helpers (no jsdom / isomorphic-dompurify).
 * Public pages still sanitize on render via `SanitizedHtml` (client DOMPurify).
 */

export { escapeHtml, isRichHtmlContent, sanitizePlainText } from '@/lib/security/escape-html'
export {
  RICH_HTML_ALLOWED_ATTR,
  RICH_HTML_ALLOWED_TAGS,
  RICH_HTML_SANITIZE_OPTIONS,
} from '@/lib/security/rich-html-config'

/** Basic server-side scrub before DB storage; display uses DOMPurify again in the browser. */
export function sanitizeRichHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed || trimmed === '<p></p>') return ''

  return trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
}
