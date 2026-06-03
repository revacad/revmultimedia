/** Allowed upload extensions for user-provided files (lowercase, no dot). */
export const ALLOWED_UPLOAD_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as const

export type AllowedUploadExtension = (typeof ALLOWED_UPLOAD_EXTENSIONS)[number]

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const PASSPORT_IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const DOCUMENT_MAX_BYTES = 25 * 1024 * 1024

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const ALLOWED_DOCUMENT_MIME_TYPES = ['application/pdf'] as const

export type UploadFileCategory = 'image' | 'document' | 'image_or_document'

export type UploadContextKind =
  | 'application_document'
  | 'profile_photo'
  | 'student_document'
  | 'certificate'
  | 'course_thumbnail'
  | 'course_content'
  | 'course_instructor_photo'
  | 'resource'
  | 'document'
  | 'team_photo'

export function uploadCategoryForContext(
  kind: UploadContextKind,
  documentType?: string,
): UploadFileCategory {
  if (kind === 'certificate') return 'document'
  if (kind === 'application_document') {
    if (documentType === 'passport_photo') return 'image'
    return 'image_or_document'
  }
  if (
    kind === 'profile_photo' ||
    kind === 'course_thumbnail' ||
    kind === 'course_content' ||
    kind === 'course_instructor_photo' ||
    kind === 'team_photo'
  ) {
    return 'image'
  }
  if (kind === 'student_document') {
    return documentType === 'certificate' ? 'document' : 'image_or_document'
  }
  if (kind === 'resource' || kind === 'document') {
    return 'image_or_document'
  }
  return 'document'
}

export function maxBytesForSniffedCategory(
  kind: UploadContextKind,
  sniffedIsPdf: boolean,
  documentType?: string,
): number {
  if (kind === 'application_document' && documentType === 'passport_photo') {
    return PASSPORT_IMAGE_MAX_BYTES
  }
  return sniffedIsPdf ? DOCUMENT_MAX_BYTES : IMAGE_MAX_BYTES
}

export function allowedMimeTypesForCategory(
  category: UploadFileCategory,
): readonly string[] {
  if (category === 'image') return ALLOWED_IMAGE_MIME_TYPES
  if (category === 'document') return ALLOWED_DOCUMENT_MIME_TYPES
  return [...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_DOCUMENT_MIME_TYPES]
}
