import { assertSafeOriginalFileName, UnsafeFileNameError } from '@/lib/security/safe-filename'
import {
  allowedMimeTypesForCategory,
  maxBytesForSniffedCategory,
  uploadCategoryForContext,
  type UploadContextKind,
} from '@/lib/security/upload-policy'
import {
  sanitizeUploadBuffer,
  sniffMatchesDeclaredMime,
  sniffMatchesExtension,
  UploadSanitizeError,
} from '@/lib/security/upload-sanitize'
import { logSuspiciousUpload } from '@/lib/security/upload-audit'
import type { SanitizedUpload } from '@/lib/security/upload-sanitize'
import { sniffFileType } from '@/lib/security/file-sniff'

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadValidationError'
  }
}

export type ValidateUploadInput = {
  buffer: Buffer
  originalFileName: string
  declaredMime: string
  uploadKind: UploadContextKind
  documentType?: string
  route: string
  ip: string | null
  userId: string | null
}

export async function validateAndSanitizeUpload(
  input: ValidateUploadInput,
): Promise<SanitizedUpload> {
  const category = uploadCategoryForContext(input.uploadKind, input.documentType)

  if (input.buffer.length === 0) {
    logReject(input, 'empty file')
    throw new UploadValidationError('File is empty')
  }

  let extension: string
  try {
    extension = assertSafeOriginalFileName(input.originalFileName)
  } catch (error) {
    logReject(
      input,
      error instanceof UnsafeFileNameError ? error.message : 'invalid file name',
    )
    throw new UploadValidationError('Invalid file name')
  }

  const allowedMimes = allowedMimeTypesForCategory(category)
  const declared = input.declaredMime.trim().toLowerCase()
  if (!allowedMimes.includes(declared)) {
    logReject(input, 'declared mime not allowed')
    throw new UploadValidationError('Invalid file type')
  }

  const sniffed = sniffFileType(input.buffer)
  const maxBytes = maxBytesForSniffedCategory(
    input.uploadKind,
    sniffed === 'pdf',
    input.documentType,
  )
  if (input.buffer.length > maxBytes) {
    logReject(input, 'file too large')
    throw new UploadValidationError(
      sniffed === 'pdf' ? 'File too large. Maximum 25MB.' : 'File too large. Maximum 5MB.',
    )
  }

  if (!sniffMatchesDeclaredMime(sniffed, declared) || !sniffMatchesExtension(sniffed, extension)) {
    logReject(input, 'content type mismatch')
    throw new UploadValidationError('File content does not match its type')
  }

  try {
    return await sanitizeUploadBuffer(input.buffer, category)
  } catch (error) {
    const reason =
      error instanceof UploadSanitizeError ? error.message : 'sanitize failed'
    logReject(input, reason)
    throw new UploadValidationError(
      error instanceof UploadSanitizeError ? error.message : 'Invalid file content',
    )
  }
}

function logReject(input: ValidateUploadInput, reason: string): void {
  logSuspiciousUpload({
    route: input.route,
    reason,
    ip: input.ip,
    userId: input.userId,
    fileName: input.originalFileName,
    uploadKind: input.uploadKind,
    declaredMime: input.declaredMime,
    sniffedType: sniffFileType(input.buffer),
  })
}
