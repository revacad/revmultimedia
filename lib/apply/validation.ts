import type { ApplicationFormData } from '@/lib/apply/types'
import { needsHybridConfirmation } from '@/lib/apply/types'
import type { ApplyCourse } from '@/lib/apply/types'

export function validateStep1(
  formData: Partial<ApplicationFormData>,
  emailVerified: boolean,
): boolean {
  if (!formData.fullName?.trim()) return false
  if (!formData.dateOfBirth) return false
  if (!formData.gender) return false
  if (!formData.country) return false
  if (!formData.phone?.trim()) return false
  if (!formData.email?.trim() || !emailVerified) return false
  if (!formData.address?.trim()) return false
  if (formData.country === 'Ghana') {
    if (!formData.stateRegion) return false
  } else {
    if (!formData.stateRegion?.trim() || !formData.city?.trim()) return false
  }
  return true
}

export function validateStep2(
  formData: Partial<ApplicationFormData>,
  courses: ApplyCourse[],
  hybridWarningAccepted: boolean,
): boolean {
  if (!formData.courseId || !formData.intakeId) return false
  const course = courses.find((c) => c.id === formData.courseId)
  if (!course) return false
  if (needsHybridConfirmation(course.mode, formData.country) && !hybridWarningAccepted) {
    return false
  }
  return true
}

export function validateStep3(formData: Partial<ApplicationFormData>): boolean {
  return Boolean(
    formData.qualification &&
      formData.institution?.trim() &&
      formData.yearCompleted &&
      formData.yearCompleted >= 1990 &&
      formData.yearCompleted <= new Date().getFullYear(),
  )
}

export function validateStep4(formData: Partial<ApplicationFormData>): boolean {
  return Boolean(formData.idDocument && formData.passportPhoto)
}

export function validateStep5(
  formData: Partial<ApplicationFormData>,
  courses: ApplyCourse[],
  hybridWarningAccepted: boolean,
): boolean {
  if (!formData.password || formData.password.length < 8) return false
  if (formData.password !== formData.confirmPassword) return false
  if (!formData.infoConfirmed) return false
  const course = courses.find((c) => c.id === formData.courseId)
  if (needsHybridConfirmation(course?.mode, formData.country) && !hybridWarningAccepted) {
    return false
  }
  return true
}
