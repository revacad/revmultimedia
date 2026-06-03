export type EnrollmentForCompletion = {
  status: string
  intakes: { end_date: string } | null
}

export function isEnrollmentCompleted(
  enrollment: EnrollmentForCompletion,
  admissionLetterSentAt: string | null | undefined,
): boolean {
  if (!admissionLetterSentAt) return false
  const endDate = enrollment.intakes?.end_date
  if (!endDate) return false

  const end = new Date(`${endDate}T23:59:59`)
  return end.getTime() < Date.now()
}

export function isStudentInActivePhase(
  enrollments: EnrollmentForCompletion[],
  admissionLetterSentAt: string | null | undefined,
): boolean {
  if (enrollments.length === 0) return true
  return enrollments.some((e) => !isEnrollmentCompleted(e, admissionLetterSentAt))
}
