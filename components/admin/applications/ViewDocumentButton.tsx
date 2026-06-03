'use client'

import { r2DocumentHref } from '@/lib/r2/document-url'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'

interface ViewDocumentButtonProps {
  r2Key: string
}

export default function ViewDocumentButton({ r2Key }: ViewDocumentButtonProps) {
  const href = r2DocumentHref(normalizeR2ObjectKey(r2Key))

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-full px-3 py-1.5 font-body text-sm font-semibold text-[#C74A86] hover:text-[#9E3068]"
    >
      View Document
    </a>
  )
}
