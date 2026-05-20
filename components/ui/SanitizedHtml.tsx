'use client'

import { useEffect, useState } from 'react'

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
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
  ],
  ALLOWED_ATTR: ['src', 'alt', 'href', 'target', 'class', 'style', 'id'],
}

interface SanitizedHtmlProps {
  html: string
  className?: string
}

export default function SanitizedHtml({ html, className }: SanitizedHtmlProps) {
  const [clean, setClean] = useState('')

  useEffect(() => {
    if (!html) {
      setClean('')
      return
    }
    void import('dompurify').then((mod) => {
      setClean(mod.default.sanitize(html, SANITIZE_OPTIONS))
    })
  }, [html])

  if (!clean) return null

  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
}
