export type PortalIdentifierType = 'application_reference' | 'student_id'

/** Detect login identifier type once the user has typed enough characters (≥10). */
export function detectPortalIdentifierType(
  value: string,
): PortalIdentifierType | null {
  const trimmed = value.trim().toUpperCase()
  if (trimmed.length < 10) return null

  if (trimmed.startsWith('REVAPP')) {
    return 'application_reference'
  }

  if (trimmed.startsWith('REV') && !trimmed.startsWith('REVAPP')) {
    return 'student_id'
  }

  return null
}
