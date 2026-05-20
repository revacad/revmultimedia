'use client'

import { useState } from 'react'
import { getDocumentUrl } from '@/actions/documents'

export default function PortalDocumentDownloadButton({ r2Key }: { r2Key: string }) {
  const [loading, setLoading] = useState(false)

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        try {
          const url = await getDocumentUrl(r2Key)
          window.open(url, '_blank', 'noopener,noreferrer')
        } finally {
          setLoading(false)
        }
      }}
      className="rounded-full border border-[#D8D8E8] px-4 py-2 font-body text-sm font-semibold text-[#5A5A7A] hover:border-[#C74A86] hover:text-[#C74A86] disabled:opacity-50"
    >
      {loading ? 'Opening…' : 'Download'}
    </button>
  )
}
