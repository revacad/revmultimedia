import type { ApplicationFormData, ApplyCourse } from '@/lib/apply/types'
import { needsHybridConfirmation } from '@/lib/apply/types'
import { courseHasOpenIntake, isIntakeFull } from '@/lib/apply/intake-availability'

export type ApplyFieldKey =
  | 'fullName'
  | 'dateOfBirth'
  | 'gender'
  | 'country'
  | 'phone'
  | 'email'
  | 'emailVerified'
  | 'address'
  | 'stateRegion'
  | 'city'
  | 'courseId'
  | 'intakeId'
  | 'hybridAttendanceConfirmed'
  | 'qualification'
  | 'institution'
  | 'yearCompleted'
  | 'idDocument'
  | 'passportPhoto'
  | 'password'
  | 'confirmPassword'
  | 'infoConfirmed'

export type ApplyFieldErrors = Partial<Record<ApplyFieldKey, string>>

export interface StepValidationResult {
  valid: boolean
  errors: ApplyFieldErrors
  summary: string | null
}

function summaryFromErrors(errors: ApplyFieldErrors): string {
  const count = Object.keys(errors).length
  if (count === 1) return 'Please fix the highlighted field before continuing.'
  return 'Please fix the highlighted fields before continuing.'
}

export function getStepValidation(
  step: number,
  formData: Partial<ApplicationFormData>,
  options: {
    emailVerified: boolean
    courses: ApplyCourse[]
    hybridWarningAccepted: boolean
  },
): StepValidationResult {
  const errors: ApplyFieldErrors = {}

  switch (step) {
    case 1: {
      if (!formData.fullName?.trim()) {
        errors.fullName = 'Enter your full legal name.'
      }
      if (!formData.dateOfBirth) {
        errors.dateOfBirth = 'Select your date of birth.'
      }
      if (!formData.gender) {
        errors.gender = 'Select your gender.'
      }
      if (!formData.country) {
        errors.country = 'Select your country of residence.'
      }
      if (!formData.phone?.trim()) {
        errors.phone = 'Enter your phone number.'
      }
      if (!formData.email?.trim()) {
        errors.email = 'Enter your email address.'
      } else if (!options.emailVerified) {
        errors.emailVerified = 'Verify your email with the code we send you.'
      }
      if (!formData.address?.trim()) {
        errors.address = 'Enter your residential address.'
      }
      if (formData.country === 'Ghana') {
        if (!formData.stateRegion) {
          errors.stateRegion = 'Select your region.'
        }
      } else if (formData.country) {
        if (!formData.stateRegion?.trim()) {
          errors.stateRegion = 'Enter your state or province.'
        }
        if (!formData.city?.trim()) {
          errors.city = 'Enter your city.'
        }
      }
      break
    }
    case 2: {
      if (!formData.courseId) {
        errors.courseId = 'Select the course you want to apply for.'
      } else {
        const course = options.courses.find((c) => c.id === formData.courseId)
        if (!course) {
          errors.courseId = 'Selected course is no longer available. Choose another.'
        } else if (course.intakes.length === 0) {
          errors.courseId = 'This course has no open intakes. Choose another course or contact us.'
        } else if (!courseHasOpenIntake(course)) {
          errors.courseId = 'All intakes for this course are full. Choose another course or contact us.'
        }
      }

      if (!formData.intakeId) {
        errors.intakeId = 'Select an intake for your chosen course.'
      } else {
        const course = options.courses.find((c) => c.id === formData.courseId)
        const intake = course?.intakes.find((i) => i.id === formData.intakeId)
        if (intake && isIntakeFull(intake)) {
          errors.intakeId = 'This intake is full. Choose another intake or course.'
        }
      }

      const course = options.courses.find((c) => c.id === formData.courseId)
      if (
        course &&
        needsHybridConfirmation(course.mode, formData.country) &&
        !options.hybridWarningAccepted
      ) {
        errors.hybridAttendanceConfirmed =
          'Confirm that you can attend in-person sessions in Accra before continuing.'
      }
      break
    }
    case 3: {
      if (!formData.qualification) {
        errors.qualification = 'Select your highest qualification.'
      }
      if (!formData.institution?.trim()) {
        errors.institution = 'Enter the institution you attended.'
      }
      if (!formData.yearCompleted) {
        errors.yearCompleted = 'Enter the year you completed your qualification.'
      } else if (formData.yearCompleted < 1990 || formData.yearCompleted > new Date().getFullYear()) {
        errors.yearCompleted = `Enter a year between 1990 and ${new Date().getFullYear()}.`
      }
      break
    }
    case 4: {
      if (!formData.idDocument) {
        errors.idDocument = 'Upload your ID document.'
      }
      if (!formData.passportPhoto) {
        errors.passportPhoto = 'Upload your passport photograph.'
      }
      break
    }
    case 5: {
      if (!formData.password || formData.password.length < 8) {
        errors.password = 'Create a password with at least 8 characters.'
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Confirm your password.'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.'
      }
      if (!formData.infoConfirmed) {
        errors.infoConfirmed = 'Confirm that your information is accurate.'
      }
      const course = options.courses.find((c) => c.id === formData.courseId)
      if (
        course &&
        needsHybridConfirmation(course.mode, formData.country) &&
        !options.hybridWarningAccepted
      ) {
        errors.hybridAttendanceConfirmed =
          'Confirm that you can attend in-person sessions in Accra before submitting.'
      }
      break
    }
    default:
      break
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    summary: Object.keys(errors).length > 0 ? summaryFromErrors(errors) : null,
  }
}

export function validateStep1(
  formData: Partial<ApplicationFormData>,
  emailVerified: boolean,
): boolean {
  return getStepValidation(1, formData, {
    emailVerified,
    courses: [],
    hybridWarningAccepted: false,
  }).valid
}

export function validateStep2(
  formData: Partial<ApplicationFormData>,
  courses: ApplyCourse[],
  hybridWarningAccepted: boolean,
): boolean {
  return getStepValidation(2, formData, {
    emailVerified: true,
    courses,
    hybridWarningAccepted,
  }).valid
}

export function validateStep3(formData: Partial<ApplicationFormData>): boolean {
  return getStepValidation(3, formData, {
    emailVerified: true,
    courses: [],
    hybridWarningAccepted: false,
  }).valid
}

export function validateStep4(formData: Partial<ApplicationFormData>): boolean {
  return getStepValidation(4, formData, {
    emailVerified: true,
    courses: [],
    hybridWarningAccepted: false,
  }).valid
}

export function validateStep5(
  formData: Partial<ApplicationFormData>,
  courses: ApplyCourse[],
  hybridWarningAccepted: boolean,
): boolean {
  return getStepValidation(5, formData, {
    emailVerified: true,
    courses,
    hybridWarningAccepted,
  }).valid
}

export function applyFieldId(key: ApplyFieldKey): string {
  return `apply-field-${key}`
}
