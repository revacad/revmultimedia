/**
 * Upload file bytes through the server after presign returns an object key.
 * Ensures magic-byte validation, sanitization, and auth run on every upload.
 */
export async function uploadFileToR2ViaServer(
  file: File,
  key: string,
  uploadContext: Record<string, unknown>,
  options?: { uploadToken?: string },
): Promise<{ key: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('key', key)
  formData.append('uploadContext', JSON.stringify(uploadContext))

  const headers: Record<string, string> = {}
  if (options?.uploadToken) {
    headers['X-Upload-Token'] = options.uploadToken
  }

  const response = await fetch('/api/r2/upload', {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(error.error ?? 'Upload failed')
  }

  const result = (await response.json()) as { key?: string }
  return { key: result.key ?? key }
}
