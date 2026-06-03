/** Long-form dates for official letters, e.g. "27 May 2026". */
export function formatLetterDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Course title line, e.g. "Graphic Design Course (September 2025 Cohort)". */
export function formatCourseEnrollmentLine(
  courseTitle: string,
  intakeName: string,
): string {
  const base = /course$/i.test(courseTitle.trim())
    ? courseTitle.trim()
    : `${courseTitle.trim()} Course`
  return intakeName ? `${base} (${intakeName})` : base
}
