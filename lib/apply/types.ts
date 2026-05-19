import type { Course, CourseMode } from '@/lib/courses/types'

export type GenderOption = 'male' | 'female' | 'prefer_not_to_say'

export type QualificationOption = 'wassce' | 'hnd' | 'degree' | 'masters' | 'other'

export interface UploadedFileMeta {
  key: string
  fileName: string
  fileSize: number
  mimeType: string
}

export interface ApplicationFormData {
  fullName?: string
  dateOfBirth?: string
  gender?: GenderOption
  country?: string
  phone?: string
  email?: string
  address?: string
  stateRegion?: string
  city?: string
  courseId?: string
  intakeId?: string
  qualification?: QualificationOption
  institution?: string
  yearCompleted?: number
  priorExperience?: string
  idDocument?: UploadedFileMeta
  passportPhoto?: UploadedFileMeta
  certificates?: UploadedFileMeta[]
  password?: string
  confirmPassword?: string
  infoConfirmed?: boolean
  hybridAttendanceConfirmed?: boolean
}

export type ApplyCourse = Pick<
  Course,
  'id' | 'title' | 'slug' | 'category' | 'mode' | 'tuition_fee_ghs' | 'intakes'
>

export function isInternational(country?: string): boolean {
  return Boolean(country && country !== 'Ghana')
}

export function needsHybridConfirmation(
  mode: CourseMode | undefined,
  country?: string,
): boolean {
  return mode === 'hybrid' && isInternational(country)
}
