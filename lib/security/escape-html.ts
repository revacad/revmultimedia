/** Escape text for safe insertion into HTML (emails, templates). */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Strip HTML and normalize plain-text fields before storage. */
export function sanitizePlainText(input: string, maxLength: number): string {
  const withoutTags = input.replace(/<[^>]*>/g, '')
  const normalized = withoutTags.replace(/\0/g, '').trim()
  return normalized.slice(0, maxLength)
}

export function isRichHtmlContent(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value)
}
