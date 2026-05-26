'use client'

import { useState } from 'react'

interface PortalPdfDownloadButtonProps {
  label: string
  onFetchUrl: () => Promise<{ url: string } | { error: string }>
  variant?: 'primary' | 'secondary'
}

export default function PortalPdfDownloadButton({
  label,
  onFetchUrl,
  variant = 'secondary',
}: PortalPdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const className =
    variant === 'primary'
      ? 'rounded-full bg-primary px-4 py-2 font-body text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50'
      : 'rounded-full border border-[#D8D8E8] px-4 py-2 font-body text-sm font-semibold text-[#5A5A7A] hover:border-[#C74A86] hover:text-[#C74A86] disabled:opacity-50'

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={loading}
        className={className}
        onClick={async () => {
          setError(null)
          setLoading(true)
          try {
            const result = await onFetchUrl()
            if ('error' in result) {
              setError(result.error)
              return
            }
            window.open(result.url, '_blank', 'noopener,noreferrer')
          } finally {
            setLoading(false)
          }
        }}
      >
        {loading ? 'Opening…' : label}
      </button>
      {error && (
        <span className="font-body text-xs text-red-600">{error}</span>
      )}
    </span>
  )
}
