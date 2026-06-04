export function uploadErrorMessage(error: unknown, options?: { declaredMime?: string }): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ''

  const lower = message.toLowerCase()

  if (
    lower.includes('disallowed content') ||
    lower.includes('embedded script') ||
    lower.includes('restricted content') ||
    lower.includes('suspicious')
  ) {
    return 'This PDF contains restricted content such as embedded scripts. Please use a standard PDF document.'
  }

  if (lower.includes('too large')) {
    return 'This file is too large. Maximum size is 20MB for PDFs.'
  }

  if (
    lower.includes('invalid file type') ||
    lower.includes('unrecognized file') ||
    lower.includes('expected an image') ||
    lower.includes('expected a pdf') ||
    lower.includes('does not match') ||
    lower.includes('file must be pdf or image')
  ) {
    return 'Only PDF and image files are accepted.'
  }

  if (message.trim()) {
    return message
  }

  return 'Upload failed. Please check the file and try again, or contact support.'
}
