import type { AllowedUploadExtension } from '@/lib/security/upload-policy'

export type SniffedFileType = 'jpeg' | 'png' | 'webp' | 'pdf' | 'unknown'

const PDF_HEADER = Buffer.from('%PDF')

export function sniffFileType(buffer: Buffer): SniffedFileType {
  if (buffer.length < 4) return 'unknown'

  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpeg'
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png'
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp'
  }

  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(PDF_HEADER)) {
    return 'pdf'
  }

  return 'unknown'
}

export function extensionForSniffedType(type: SniffedFileType): AllowedUploadExtension | null {
  switch (type) {
    case 'jpeg':
      return 'jpg'
    case 'png':
      return 'png'
    case 'webp':
      return 'webp'
    case 'pdf':
      return 'pdf'
    default:
      return null
  }
}

export function mimeTypeForSniffedType(type: SniffedFileType): string | null {
  switch (type) {
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'pdf':
      return 'application/pdf'
    default:
      return null
  }
}

/** Reject PDFs with embedded scripts or launch/executable actions only. */
export function pdfContainsSuspiciousMarkers(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 512_000)).toString('latin1')
  const patterns = [/\/JavaScript\b/i, /\/JS\s/i, /\/Launch\b/i, /\/EmbeddedFile\b/i]
  return patterns.some((pattern) => pattern.test(sample))
}
