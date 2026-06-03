import sharp from 'sharp'
import {
  extensionForSniffedType,
  mimeTypeForSniffedType,
  pdfContainsSuspiciousMarkers,
  sniffFileType,
  type SniffedFileType,
} from '@/lib/security/file-sniff'
import type { UploadFileCategory } from '@/lib/security/upload-policy'

export class UploadSanitizeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadSanitizeError'
  }
}

export type SanitizedUpload = {
  buffer: Buffer
  contentType: string
  extension: string
  sniffedType: SniffedFileType
}

async function reencodeImage(
  buffer: Buffer,
  sniffed: Exclude<SniffedFileType, 'pdf' | 'unknown'>,
): Promise<SanitizedUpload> {
  const pipeline = sharp(buffer, { failOn: 'error' }).rotate()

  let output: Buffer
  let contentType: string
  let extension: string

  switch (sniffed) {
    case 'jpeg':
      output = await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer()
      contentType = 'image/jpeg'
      extension = 'jpg'
      break
    case 'png':
      output = await pipeline.png({ compressionLevel: 9 }).toBuffer()
      contentType = 'image/png'
      extension = 'png'
      break
    case 'webp':
      output = await pipeline.webp({ quality: 90 }).toBuffer()
      contentType = 'image/webp'
      extension = 'webp'
      break
    default:
      throw new UploadSanitizeError('Unsupported image format')
  }

  return {
    buffer: output,
    contentType,
    extension,
    sniffedType: sniffed,
  }
}

function sanitizePdf(buffer: Buffer): SanitizedUpload {
  if (pdfContainsSuspiciousMarkers(buffer)) {
    throw new UploadSanitizeError('PDF contains disallowed content')
  }

  return {
    buffer,
    contentType: 'application/pdf',
    extension: 'pdf',
    sniffedType: 'pdf',
  }
}

export async function sanitizeUploadBuffer(
  buffer: Buffer,
  category: UploadFileCategory,
): Promise<SanitizedUpload> {
  const sniffed = sniffFileType(buffer)
  if (sniffed === 'unknown') {
    throw new UploadSanitizeError('Unrecognized file content')
  }

  if (category === 'image' && sniffed === 'pdf') {
    throw new UploadSanitizeError('Expected an image file')
  }
  if (category === 'document' && sniffed !== 'pdf') {
    throw new UploadSanitizeError('Expected a PDF document')
  }
  if (sniffed === 'pdf') {
    return sanitizePdf(buffer)
  }

  return reencodeImage(buffer, sniffed)
}

export function sniffMatchesDeclaredMime(
  sniffed: SniffedFileType,
  declaredMime: string,
): boolean {
  const expected = mimeTypeForSniffedType(sniffed)
  if (!expected) return false
  return expected === declaredMime.trim().toLowerCase()
}

export function sniffMatchesExtension(
  sniffed: SniffedFileType,
  extension: string,
): boolean {
  const fromSniff = extensionForSniffedType(sniffed)
  if (!fromSniff) return false
  const normalized = extension.toLowerCase()
  if (fromSniff === 'jpg' && (normalized === 'jpg' || normalized === 'jpeg')) {
    return true
  }
  return fromSniff === normalized
}
