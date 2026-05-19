'use client'

import { useRef, useState } from 'react'
import DocumentUploadSlot from '@/components/public/apply/DocumentUploadSlot'
import { uploadApplicationDocument, formatFileSize } from '@/lib/apply/upload'
import type { ApplicationFormData, UploadedFileMeta } from '@/lib/apply/types'

interface Step4DocumentsProps {
  formData: Partial<ApplicationFormData>
  draftId: string
  onChange: (patch: Partial<ApplicationFormData>) => void
}

export default function Step4Documents({ formData, draftId, onChange }: Step4DocumentsProps) {
  const isGhana = formData.country === 'Ghana'
  const idLabel = isGhana ? 'Ghana Card' : 'Passport'

  return (
    <div>
      <h2 className="font-display text-2xl text-dark">Upload your documents.</h2>
      <p className="mb-6 mt-2 font-body text-[15px] text-gray-400">
        All documents are stored securely and used only for admissions purposes.
      </p>

      <div className="flex flex-col gap-6">
        <DocumentUploadSlot
          label={idLabel}
          subtext="PDF, JPG, or PNG — max 5MB"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          maxSizeBytes={5 * 1024 * 1024}
          draftId={draftId}
          documentType={isGhana ? 'national_id' : 'passport'}
          value={formData.idDocument}
          onChange={(idDocument) => onChange({ idDocument })}
        />

        <DocumentUploadSlot
          label="Passport Photograph"
          subtext="JPG or PNG only — max 2MB. This will be used as your profile photo if accepted."
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          maxSizeBytes={2 * 1024 * 1024}
          draftId={draftId}
          documentType="passport_photo"
          value={formData.passportPhoto}
          onChange={(passportPhoto) => onChange({ passportPhoto })}
        />

        <CertificatesUpload
          draftId={draftId}
          certificates={formData.certificates ?? []}
          onChange={(certificates) => onChange({ certificates })}
        />
      </div>
    </div>
  )
}

function CertificateFileRow({
  file,
  label,
  onRemove,
}: {
  file: UploadedFileMeta
  label: string
  onRemove: () => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-gray-600">{label}</span>
      <div className="flex items-center justify-between gap-3 rounded-[14px] border-2 border-[#2DBFB8] bg-[#EBF9F8] px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <svg className="h-5 w-5 shrink-0 text-[#2DBFB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-dark">{file.fileName}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-red-500 hover:text-red-600"
          aria-label={`Remove ${label}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function CertificatesUpload({
  draftId,
  certificates,
  onChange,
}: {
  draftId: string
  certificates: NonNullable<ApplicationFormData['certificates']>
  onChange: (files: ApplicationFormData['certificates']) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAddMore = certificates.length < 3

  const uploadCertificate = async (file: File, index: number): Promise<UploadedFileMeta> => {
    return uploadApplicationDocument(file, draftId, `certificate_${index}`)
  }

  const handleCertificatesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return

    const remaining = 3 - certificates.length
    const selectedFiles = files.slice(0, remaining)

    setUploading(true)
    setError(null)

    const uploaded: UploadedFileMeta[] = []
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]!
        const docIndex = certificates.length + uploaded.length + 1
        const meta = await uploadCertificate(file, docIndex)
        uploaded.push(meta)
      }
      if (uploaded.length > 0) {
        onChange([...certificates, ...uploaded])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      if (uploaded.length > 0) {
        onChange([...certificates, ...uploaded])
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-medium text-gray-600">Supporting Certificates (optional)</p>
      <p className="text-xs text-gray-400">PDF, JPG, or PNG — max 5MB each (up to 3 files)</p>

      {certificates.map((file, index) => (
        <CertificateFileRow
          key={file.key}
          label={`Certificate ${index + 1}`}
          file={file}
          onRemove={() => onChange(certificates.filter((_, i) => i !== index))}
        />
      ))}

      {canAddMore && (
        <>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-[14px] border-2 border-dashed border-[#D8D8E8] bg-[#F7F8FC] px-8 py-8 text-center transition-colors hover:border-[#C74A86] hover:bg-[#FDF0F6] disabled:opacity-60"
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
            <p className="mt-1 text-xs text-gray-400">
              Select up to {3 - certificates.length} file(s)
            </p>
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => void handleCertificatesChange(e)}
          />
        </>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
