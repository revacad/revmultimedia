type PresignContext =
  | { type: 'profile_photo'; studentId: string }
  | { type: 'student_document'; studentId: string; documentType: 'certificate' | 'other' }
  | { type: 'certificate'; studentId: string; courseSlug: string }

export async function presignPortalUpload(
  file: File,
  uploadContext: PresignContext,
): Promise<{ presignedUrl: string; key: string }> {
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

  return (await res.json()) as { presignedUrl: string; key: string }
}

export async function putFileToPresignedUrl(presignedUrl: string, file: File): Promise<void> {
  const putRes = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!putRes.ok) {
    throw new Error('Upload failed. Please try again.')
  }
}

export async function uploadViaPresign(file: File, uploadContext: PresignContext): Promise<string> {
  const { presignedUrl, key } = await presignPortalUpload(file, uploadContext)
  await putFileToPresignedUrl(presignedUrl, file)
  return key
}
