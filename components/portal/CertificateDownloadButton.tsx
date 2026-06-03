'use client'

import { r2DocumentHref } from '@/lib/r2/document-url'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'

export default function CertificateDownloadButton({
  r2Key,
  prominent = false,
}: {
  r2Key: string
  prominent?: boolean
}) {
  return (
    <a
      href={r2DocumentHref(normalizeR2ObjectKey(r2Key))}
      target="_blank"
      rel="noopener noreferrer"
      className={
        prominent
          ? 'inline-flex rounded-full bg-[#C74A86] px-6 py-3 font-body text-sm font-semibold text-white shadow-[0_8px_32px_rgba(199,74,134,0.25)] hover:opacity-90'
          : 'rounded-full border border-[#D8D8E8] px-4 py-2 font-body text-sm font-semibold text-[#5A5A7A] hover:border-[#C74A86] hover:text-[#C74A86]'
      }
    >
      Download certificate
    </a>
  )
}
