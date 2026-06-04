const WRONG_TYPE =
  'This file type is not accepted. Please upload a JPG, PNG, or PDF file.'
const IMAGE_TOO_LARGE =
  'This image is too large. Maximum size is 2MB. Please compress it and try again.'
const DOCUMENT_TOO_LARGE = 'This file is too large. Maximum size is 5MB.'
const INVALID_FILENAME =
  'This filename is not valid. Please rename your file using only letters, numbers, and hyphens (e.g. ghana-card.jpg) and try again.'
const GENERAL_INVALID =
  'This file could not be uploaded. Please check the file and try again.'

function hasInvalidFileName(fileName: string): boolean {
  const base = fileName.split(/[/\\]/).pop()?.trim() ?? ''
  if (!base) return true

  const parts = base.split('.')
  if (parts.length !== 2) return true

  const stem = parts[0] ?? ''
  if (!stem || /[<>:"|?*\x00-\x1f]/.test(stem)) return true

  return false
}

function fileMatchesAccept(file: File, acceptList: string[]): boolean {
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
  return acceptList.some((a) => {
    if (a.startsWith('.')) return ext === a.toLowerCase()
    if (a === 'image/*') return file.type.startsWith('image/')
    return file.type === a
  })
}

export function validateUploadFile(
  file: File,
  accept: string,
  maxSizeBytes: number,
  sizeKind: 'image' | 'document',
): string | null {
  try {
    if (hasInvalidFileName(file.name)) {
      return INVALID_FILENAME
    }

    const acceptList = accept.split(',').map((s) => s.trim())
    if (!fileMatchesAccept(file, acceptList)) {
      return WRONG_TYPE
    }

    if (file.size > maxSizeBytes) {
      return sizeKind === 'image' ? IMAGE_TOO_LARGE : DOCUMENT_TOO_LARGE
    }

    return null
  } catch {
    return GENERAL_INVALID
  }
}
