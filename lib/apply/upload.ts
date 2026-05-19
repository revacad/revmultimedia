import type { UploadedFileMeta } from '@/lib/apply/types'

export async function uploadDocument(
  file: File,
  key: string,
  uploadContext: string,
): Promise<{ success: boolean; key?: string; error?: string }> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('key', key)
    formData.append('uploadContext', uploadContext)

    const response = await fetch('/api/r2/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { error?: string }
      return { success: false, error: error.error || 'Upload failed' }
    }

    const result = (await response.json()) as { key?: string }
    return { success: true, key: result.key ?? key }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload file. Please try again.' }
  }
}

export async function uploadApplicationDocument(
  file: File,
  draftId: string,
  documentType: string,
): Promise<UploadedFileMeta> {
  const uploadContext = JSON.stringify({
    type: 'application_document',
    draftId,
    documentType,
  })

  const presignRes = await fetch('/api/r2/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadContext: {
        type: 'application_document',
        draftId,
        documentType,
      },
    }),
  })

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Failed to prepare upload')
  }

  const { key } = (await presignRes.json()) as { key: string }

  const uploadResult = await uploadDocument(file, key, uploadContext)
  if (!uploadResult.success) {
    throw new Error(uploadResult.error ?? 'Failed to upload file')
  }

  const confirmRes = await fetch('/api/r2/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      r2Key: key,
      documentType,
      draftId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    }),
  })

  if (!confirmRes.ok) {
    throw new Error('Failed to confirm upload')
  }

  return {
    key,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
