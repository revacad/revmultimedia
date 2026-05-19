'use client'

import { useState } from 'react'
import { getDocumentUrl } from '@/actions/documents'

export default function DocumentDownloadLink({
  r2Key,
  fileName,
}: {
  r2Key: string
  fileName: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const url = await getDocumentUrl(r2Key)
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void handleDownload()}
      className="font-body text-sm font-semibold text-[#2DBFB8] hover:text-[#1E9990] disabled:opacity-50"
    >
      {loading ? 'Preparing…' : `Download ${fileName}`}
    </button>
  )
}
