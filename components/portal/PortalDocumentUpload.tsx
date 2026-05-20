'use client'

import { useRef, useState } from 'react'
import { uploadStudentDocument } from '@/actions/student'
import { formatFileSize } from '@/lib/apply/upload'
import { uploadViaPresign } from '@/lib/portal/upload'

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'
const MAX_SIZE = 5 * 1024 * 1024

interface PortalDocumentUploadProps {
  studentDbId: string
}

export default function PortalDocumentUpload({ studentDbId }: PortalDocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [documentType, setDocumentType] = useState<'certificate' | 'other'>('certificate')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFile = async (file: File) => {
    setError(null)
    setSuccess(false)

    const allowed = ACCEPT.split(',')
    if (!allowed.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or PDF file.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('File must be 5MB or smaller.')
      return
    }

    setUploading(true)
    try {
      const key = await uploadViaPresign(file, {
        type: 'student_document',
        studentId: studentDbId,
        documentType,
      })

      const result = await uploadStudentDocument({
        studentDbId,
        documentType,
        r2Key: key,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-card">
      <h2 className="font-body text-base font-semibold text-[#1A1A2E]">Upload Additional Document</h2>
      <p className="mt-1 font-body text-sm text-[#9898B8]">
        You can upload additional certificates or supporting documents
      </p>

      <div className="mt-4">
        <label htmlFor="docType" className="font-body text-sm font-semibold text-[#5A5A7A]">
          Document type
        </label>
        <select
          id="docType"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as 'certificate' | 'other')}
          className="mt-1 w-full rounded-[10px] border border-[#D8D8E8] px-4 py-3 font-body text-sm text-[#1A1A2E]"
        >
          <option value="certificate">Certificate</option>
          <option value="other">Other</option>
        </select>
      </div>

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file) void handleFile(file)
        }}
        className="mt-4 w-full rounded-[14px] border-2 border-dashed border-[#D8D8E8] bg-[#F7F8FC] px-8 py-8 text-center transition-colors hover:border-[#C74A86] hover:bg-[#FDF0F6] disabled:opacity-60"
      >
        <p className="font-body text-sm font-medium text-[#1A1A2E]">
          {uploading ? 'Uploading…' : 'Click to upload or drag and drop'}
        </p>
        <p className="mt-1 font-body text-xs text-[#9898B8]">
          Images or PDF · max {formatFileSize(MAX_SIZE)}
        </p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      {success && (
        <p className="mt-3 font-body text-sm font-medium text-[#1E9990]">Document uploaded successfully</p>
      )}
      {error && <p className="mt-3 font-body text-sm text-[#E84A4A]">{error}</p>}

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="mt-4 rounded-full bg-[#C74A86] px-5 py-2.5 font-body text-sm font-semibold text-white disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Upload Document'}
      </button>
    </section>
  )
}
