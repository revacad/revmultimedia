import { uploadFileToR2ViaServer } from '@/lib/r2/client-upload'

export type PresignContext =
  | { type: 'profile_photo'; studentId: string }
  | { type: 'student_document'; studentId: string; documentType: 'certificate' | 'other' }
  | {
      type: 'certificate'
      studentId: string
      courseSlug: string
      enrollmentId: string
    }

export async function presignPortalUpload(
  file: File,
  uploadContext: PresignContext,
): Promise<{ key: string }> {
  const res = await fetch('/api/r2/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadContext,
    }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? 'Failed to prepare upload')
  }

  return (await res.json()) as { key: string }
}

export async function uploadViaPresign(file: File, uploadContext: PresignContext): Promise<string> {
  const { key } = await presignPortalUpload(file, uploadContext)
  await uploadFileToR2ViaServer(file, key, uploadContext)
  return key
}
