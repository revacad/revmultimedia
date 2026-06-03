import type { UploadedFileMeta } from '@/lib/apply/types'
import { uploadFileToR2ViaServer } from '@/lib/r2/client-upload'

export async function uploadDocument(
  file: File,
  key: string,
  uploadContext: Record<string, unknown>,
  uploadToken: string,
): Promise<{ success: boolean; key?: string; error?: string }> {
  try {
    const result = await uploadFileToR2ViaServer(file, key, uploadContext, { uploadToken })
    return { success: true, key: result.key }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file. Please try again.',
    }
  }
}

export async function uploadApplicationDocument(
  file: File,
  draftId: string,
  documentType: string,
  uploadToken: string,
): Promise<UploadedFileMeta> {
  const uploadContext = {
    type: 'application_document',
    draftId,
    documentType,
  }

  const presignRes = await fetch('/api/r2/presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Upload-Token': uploadToken,
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadContext,
    }),
  })

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Failed to prepare upload')
  }

  const { key } = (await presignRes.json()) as { key: string }

  const uploadResult = await uploadDocument(file, key, uploadContext, uploadToken)
  if (!uploadResult.success) {
    throw new Error(uploadResult.error ?? 'Failed to upload file')
  }

  const confirmRes = await fetch('/api/r2/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Upload-Token': uploadToken,
    },
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
