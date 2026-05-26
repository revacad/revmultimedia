'use client'

import { useEffect, useState } from 'react'
import { RICH_HTML_SANITIZE_OPTIONS } from '@/lib/security/rich-html-config'

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
      setClean(mod.default.sanitize(html, RICH_HTML_SANITIZE_OPTIONS))
    })
  }, [html])

  if (!clean) return null

  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
}
