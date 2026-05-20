'use client'

import { useState, useTransition } from 'react'
import Button from '@/components/ui/Button'

interface CsvExportButtonProps {
  label: string
  filename: string
  exportFn: () => Promise<string>
}

export default function CsvExportButton({ label, filename, exportFn }: CsvExportButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleExport() {
    setError(null)
    startTransition(async () => {
      try {
        const csv = await exportFn()
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename
        anchor.click()
        URL.revokeObjectURL(url)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Export failed')
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-center"
        disabled={pending}
        onClick={handleExport}
      >
        {pending ? 'Exporting…' : label}
      </Button>
      {error && <span className="text-center text-xs text-red-500">{error}</span>}
    </div>
  )
}
