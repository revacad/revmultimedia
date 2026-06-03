import { normalizeR2ObjectKey } from '@/lib/r2/keys'

/** Portal uploads use the public student_id (REV…) in R2 paths, not the DB uuid. */
export function isR2KeyOwnedByStudent(
  r2Key: string,
  publicStudentId: string,
): boolean {
  const key = normalizeR2ObjectKey(r2Key)
  const id = publicStudentId.trim()
  if (!key || !id) return false

  const prefixes = [
    `documents/${id}/`,
    `students/${id}/`,
    `profiles/${id}/`,
  ]

  return prefixes.some((prefix) => key.startsWith(prefix))
}
