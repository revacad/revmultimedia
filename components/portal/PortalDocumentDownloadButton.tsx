'use client'

import { r2DocumentHref } from '@/lib/r2/document-url'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'

export default function PortalDocumentDownloadButton({ r2Key }: { r2Key: string }) {
  return (
    <a
      href={r2DocumentHref(normalizeR2ObjectKey(r2Key))}
      target="_blank"
      rel="noopener noreferrer"
      className="font-body text-sm font-semibold text-[#2DBFB8] hover:text-[#1E9990]"
    >
      Download
    </a>
  )
}
