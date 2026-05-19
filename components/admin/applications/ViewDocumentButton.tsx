'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { getDocumentUrl } from '@/actions/documents'

interface ViewDocumentButtonProps {
  r2Key: string
}

export default function ViewDocumentButton({ r2Key }: ViewDocumentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleView() {
    setLoading(true)
    setError(null)
    try {
      const url = await getDocumentUrl(r2Key)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setError('Could not open document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={handleView}>
        {loading ? 'Opening…' : 'View Document'}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  )
}
