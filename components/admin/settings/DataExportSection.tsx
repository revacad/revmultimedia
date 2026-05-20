'use client'

import { useState, useTransition } from 'react'
import { triggerDatabaseExport } from '@/actions/export'

export default function DataExportSection() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastExported, setLastExported] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleExport() {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await triggerDatabaseExport()
      if ('error' in result) {
        setError(result.error)
        return
      }
      const total = Object.values(result.counts).reduce((a, b) => a + b, 0)
      setMessage(`Export complete. ${total} records saved to ${result.key}.`)
      setLastExported(result.exportedAt)
    })
  }

  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-[#5A5A7A]">
        Export critical database tables to Cloudflare R2 as JSON. Schedule weekly runs via
        cron-job.org using POST /api/export with your export secret.
      </p>
      <p className="font-body text-xs text-[#9898B8]">
        Last exported: {lastExported ? new Date(lastExported).toLocaleString() : 'Never'}
      </p>
      {error && <p className="font-body text-sm text-[#E84A4A]">{error}</p>}
      {message && <p className="font-body text-sm text-[#1E9990]">{message}</p>}
      <button
        type="button"
        onClick={handleExport}
        disabled={pending}
        className="rounded-full bg-primary px-6 py-2.5 font-body text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? 'Exporting…' : 'Export Database to R2'}
      </button>
    </div>
  )
}
