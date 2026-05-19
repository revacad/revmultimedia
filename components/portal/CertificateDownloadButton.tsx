'use client'

import { useState } from 'react'
import { getDocumentUrl } from '@/actions/documents'

export default function CertificateDownloadButton({ r2Key }: { r2Key: string }) {
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
      className="rounded-full bg-[#2DBFB8] px-4 py-2 font-body text-sm font-semibold text-white hover:bg-[#1E9990] disabled:opacity-50"
    >
      {loading ? 'Preparing…' : 'Download Certificate'}
    </button>
  )
}
