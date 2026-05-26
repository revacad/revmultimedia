/** Allowed tags for admin-authored rich text (curriculum, course descriptions). */
export const RICH_HTML_ALLOWED_TAGS = [
  'h2',
  'h3',
  'p',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'u',
  'blockquote',
  'hr',
  'br',
  'img',
  'a',
  'div',
] as const

export const RICH_HTML_ALLOWED_ATTR = ['src', 'alt', 'href', 'target', 'class', 'style', 'id'] as const

export const RICH_HTML_SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [...RICH_HTML_ALLOWED_TAGS],
  ALLOWED_ATTR: [...RICH_HTML_ALLOWED_ATTR],
}
