'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadCertificate } from '@/actions/certificate'
import { uploadViaPresign } from '@/lib/portal/upload'

interface CertificateUploadSlotProps {
  studentDbId: string
  studentPublicId: string
  enrollmentId: string
  courseId: string
  courseSlug: string
  existing?: {
    fileName: string
    uploadedAt: string
    r2Key: string
  }
}

export default function CertificateUploadSlot({
  studentDbId,
  studentPublicId,
  enrollmentId,
  courseId,
  courseSlug,
  existing,
}: CertificateUploadSlotProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    if (file.type !== 'application/pdf') {
      setError('Certificate must be a PDF file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be 10MB or smaller.')
      return
    }

    setUploading(true)
    try {
      const key = await uploadViaPresign(file, {
        type: 'certificate',
        studentId: studentPublicId,
        courseSlug,
      })

      const result = await uploadCertificate({
        studentId: studentDbId,
        enrollmentId,
        courseId,
        r2Key: key,
        fileName: file.name,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        router.refresh()
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (existing) {
    return (
      <div className="mt-3 rounded-lg border border-[#EFEFF5] bg-[#F8F8FC] p-4">
        <p className="font-body text-sm text-[#1A1A2E]">{existing.fileName}</p>
        <p className="font-body text-xs text-[#9898B8]">
          Uploaded {new Date(existing.uploadedAt).toLocaleDateString('en-GB')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ViewCertificateButton r2Key={existing.r2Key} label="View" />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-[#D8D8E8] px-3 py-1.5 font-body text-xs font-semibold text-[#5A5A7A] hover:border-primary hover:text-primary"
          >
            {uploading ? 'Uploading…' : 'Replace'}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
            e.target.value = ''
          }}
        />
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-[14px] border-2 border-dashed border-[#D8D8E8] bg-[#F8F8FC] px-6 py-6 text-center hover:border-primary hover:bg-primary/5 disabled:opacity-60"
      >
        <p className="font-body text-sm font-medium text-[#1A1A2E]">
          {uploading ? 'Uploading…' : 'Click to upload certificate (PDF, max 10MB)'}
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function ViewCertificateButton({ r2Key, label }: { r2Key: string; label: string }) {
  const [loading, setLoading] = useState(false)

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        try {
          const { getDocumentUrl } = await import('@/actions/documents')
          const url = await getDocumentUrl(r2Key)
          window.open(url, '_blank', 'noopener,noreferrer')
        } finally {
          setLoading(false)
        }
      }}
      className="rounded-full bg-accent px-3 py-1.5 font-body text-xs font-semibold text-white"
    >
      {loading ? 'Opening…' : label}
    </button>
  )
}
