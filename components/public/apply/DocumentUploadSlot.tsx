'use client'

import { useCallback, useRef, useState } from 'react'
import FormFieldLabel from '@/components/public/apply/FormFieldLabel'
import { uploadApplicationDocument, formatFileSize } from '@/lib/apply/upload'
import type { UploadedFileMeta } from '@/lib/apply/types'

interface DocumentUploadSlotProps {
  label: string
  required?: boolean
  fieldError?: string
  subtext?: string
  accept: string
  maxSizeBytes: number
  draftId: string
  documentType: string
  value?: UploadedFileMeta
  onChange: (file: UploadedFileMeta | undefined) => void
}

export default function DocumentUploadSlot({
  label,
  required,
  fieldError,
  subtext,
  accept,
  maxSizeBytes,
  draftId,
  documentType,
  value,
  onChange,
}: DocumentUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const acceptList = accept.split(',').map((s) => s.trim())

  const validateFile = useCallback(
    (file: File): string | null => {
      const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
      const mimeOk = acceptList.some((a) => {
        if (a.startsWith('.')) return ext === a.toLowerCase()
        if (a === 'image/*') return file.type.startsWith('image/')
        return file.type === a
      })
      if (!mimeOk) return `Accepted formats: ${accept}`
      if (file.size > maxSizeBytes) {
        return `Maximum file size: ${formatFileSize(maxSizeBytes)}`
      }
      return null
    },
    [accept, acceptList, maxSizeBytes],
  )

  const handleFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setUploading(true)
    try {
      const meta = await uploadApplicationDocument(file, draftId, documentType)
      onChange(meta)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <FormFieldLabel required={required}>{label}</FormFieldLabel>
        <div className="flex items-center justify-between gap-3 rounded-[14px] border-2 border-[#2DBFB8] bg-[#EBF9F8] px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-[#2DBFB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-dark">{value.fileName}</p>
              <p className="text-xs text-gray-500">{formatFileSize(value.fileSize)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="shrink-0 text-red-500 hover:text-red-600"
            aria-label="Remove file"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <FormFieldLabel required={required}>{label}</FormFieldLabel>
      {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`w-full rounded-[14px] border-2 border-dashed bg-[#F7F8FC] px-8 py-8 text-center transition-colors hover:border-[#C74A86] hover:bg-[#FDF0F6] disabled:opacity-60 ${
          fieldError ? 'border-[#E84A4A]' : 'border-[#D8D8E8]'
        }`}
      >
        <svg className="mx-auto h-8 w-8 text-[#9898B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mt-3 text-sm font-medium text-dark">
          {uploading ? 'Uploading…' : 'Click to upload or drag and drop'}
        </p>
        <p className="mt-1 text-xs text-gray-400">{subtext ?? accept}</p>
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onInputChange} />
      {fieldError && (
        <p className="text-sm text-[#E84A4A]" role="alert">
          {fieldError}
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
