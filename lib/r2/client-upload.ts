import { uploadErrorMessage } from '@/lib/security/upload-error-message'

/**
 * Upload file bytes through the server after presign returns an object key.
 * Ensures magic-byte validation, sanitization, and auth run on every upload.
 */
export async function uploadFileToR2ViaServer(
  file: File,
  key: string,
  uploadContext: Record<string, unknown>,
  options?: { uploadToken?: string; onProgress?: (percent: number) => void },
): Promise<{ key: string }> {
  if (options?.onProgress) {
    return uploadFileToR2ViaServerWithProgress(file, key, uploadContext, {
      uploadToken: options.uploadToken,
      onProgress: options.onProgress,
    })
  }

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
    throw new Error(
      uploadErrorMessage(new Error(error.error ?? 'Upload failed'), {
        declaredMime: file.type,
      }),
    )
  }

  const result = (await response.json()) as { key?: string }
  return { key: result.key ?? key }
}

function uploadFileToR2ViaServerWithProgress(
  file: File,
  key: string,
  uploadContext: Record<string, unknown>,
  options: { uploadToken?: string; onProgress: (percent: number) => void },
): Promise<{ key: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('key', key)
    formData.append('uploadContext', JSON.stringify(uploadContext))

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as { key?: string }
          options.onProgress(100)
          resolve({ key: result.key ?? key })
        } catch {
          options.onProgress(100)
          resolve({ key })
        }
        return
      }

      try {
        const error = JSON.parse(xhr.responseText) as { error?: string }
        reject(
          new Error(
            uploadErrorMessage(new Error(error.error ?? 'Upload failed'), {
              declaredMime: file.type,
            }),
          ),
        )
      } catch {
        reject(
          new Error(
            uploadErrorMessage(new Error('Upload failed'), { declaredMime: file.type }),
          ),
        )
      }
    }

    xhr.onerror = () =>
      reject(
        new Error(
          uploadErrorMessage(new Error('Upload failed'), { declaredMime: file.type }),
        ),
      )
    xhr.open('POST', '/api/r2/upload')
    if (options.uploadToken) {
      xhr.setRequestHeader('X-Upload-Token', options.uploadToken)
    }
    xhr.send(formData)
  })
}
