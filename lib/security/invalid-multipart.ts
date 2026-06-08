import type { NextRequest } from 'next/server'

/** POST/PUT/PATCH with multipart/form-data but no boundary cannot be parsed safely. */
export function hasInvalidMultipartContentType(request: NextRequest): boolean {
  const method = request.method.toUpperCase()
  if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
    return false
  }

  const contentType = request.headers.get('content-type')
  if (!contentType) return false

  const lower = contentType.toLowerCase()
  if (!lower.startsWith('multipart/form-data')) return false

  return !lower.includes('boundary=')
}
