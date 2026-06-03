import {
  ALLOWED_UPLOAD_EXTENSIONS,
  type AllowedUploadExtension,
} from '@/lib/security/upload-policy'

export class UnsafeFileNameError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsafeFileNameError'
  }
}

/** Reject path segments, double extensions, and disallowed extensions. */
export function assertSafeOriginalFileName(fileName: string): AllowedUploadExtension {
  const base = fileName.split(/[/\\]/).pop()?.trim() ?? ''
  if (!base) {
    throw new UnsafeFileNameError('Invalid file name')
  }

  const parts = base.split('.')
  if (parts.length !== 2) {
    throw new UnsafeFileNameError('Invalid file name')
  }

  const [, extRaw] = parts
  const ext = extRaw?.toLowerCase() ?? ''
  if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext as AllowedUploadExtension)) {
    throw new UnsafeFileNameError('File type not allowed')
  }

  const stem = parts[0] ?? ''
  if (!stem || /[<>:"|?*\x00-\x1f]/.test(stem)) {
    throw new UnsafeFileNameError('Invalid file name')
  }

  return ext as AllowedUploadExtension
}

/** Extension from a validated original name (presign metadata only). */
export function safeExtensionFromFileName(fileName: string): AllowedUploadExtension {
  return assertSafeOriginalFileName(fileName)
}
