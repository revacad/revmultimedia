/** Use only the base name; strip path segments and risky characters. */
export function sanitizeFileName(fileName: string, maxLength = 255): string {
  const base = fileName.split(/[/\\]/).pop() ?? 'file'
  const safe = base.replace(/[^\w.\- ()]/g, '_').trim()
  const name = safe || 'file'
  return name.slice(0, maxLength)
}

export const APPLICATION_DOCUMENT_TYPES = [
  'national_id',
  'passport',
  'passport_photo',
  'certificate',
] as const

export type ApplicationDocumentType = (typeof APPLICATION_DOCUMENT_TYPES)[number]

export function isApplicationDocumentType(value: string): value is ApplicationDocumentType {
  return (APPLICATION_DOCUMENT_TYPES as readonly string[]).includes(value)
}
