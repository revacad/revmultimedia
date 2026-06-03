import sanitizeHtml from 'sanitize-html'

export function sanitizeCourseContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'h1',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a',
      'img',
      'hr',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'class'],
      '*': ['class'],
    },
    allowedSchemes: ['https', 'http'],
  })
}
