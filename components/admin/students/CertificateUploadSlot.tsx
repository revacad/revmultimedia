'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadCertificate } from '@/actions/certificate'
import { r2DocumentHref } from '@/lib/r2/document-url'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'
import { CERTIFICATE_UPLOAD_REQUIRES_ENROLLMENT_MESSAGE } from '@/lib/enrollment/certificate-upload'
import { uploadViaPresign } from '@/lib/portal/upload'

interface CertificateUploadSlotProps {
  studentDbId: string
  studentPublicId: string
  enrollmentId: string
  courseId: string
  courseSlug: string
  canUpload: boolean
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
  canUpload,
  existing,
}: CertificateUploadSlotProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    if (!canUpload) {
      setError(CERTIFICATE_UPLOAD_REQUIRES_ENROLLMENT_MESSAGE)
      return
    }
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
        enrollmentId,
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
          {canUpload && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-full border border-[#D8D8E8] px-3 py-1.5 font-body text-xs font-semibold text-[#5A5A7A] hover:border-primary hover:text-primary"
            >
              {uploading ? 'Uploading…' : 'Replace'}
            </button>
          )}
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

  if (!canUpload) {
    return (
      <div className="mt-3 rounded-lg border border-[#EFEFF5] bg-[#F8F8FC] p-4">
        <p className="font-body text-sm text-[#5A5A7A]">
          {CERTIFICATE_UPLOAD_REQUIRES_ENROLLMENT_MESSAGE}
        </p>
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
  return (
    <a
      href={r2DocumentHref(normalizeR2ObjectKey(r2Key))}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full bg-accent px-3 py-1.5 font-body text-xs font-semibold text-white"
    >
      {label}
    </a>
  )
}
