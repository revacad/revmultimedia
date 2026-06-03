'use client'

import { sanitizeCourseContent } from '@/lib/security/sanitize-html'

interface SanitizedHtmlProps {
  html: string
  className?: string
}

export default function SanitizedHtml({ html, className }: SanitizedHtmlProps) {
  const clean = html ? sanitizeCourseContent(html) : ''
  if (!clean) return null

  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
}
