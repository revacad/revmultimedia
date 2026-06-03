import type { SupabaseClient } from '@supabase/supabase-js'
import { STUDENT_ID_RE } from '@/lib/validations/auth'

export type ReturningStudentContext = {
  studentDbId: string
  permanentStudentId: string
  authUserId: string
  fullName: string
  realEmail: string
  phone: string
  dateOfBirth: string
  gender: string
  country: string
  address: string
  stateRegion: string | null
  city: string | null
  qualification: string
  institution: string
  yearCompleted: number
  priorExperience: string | null
}

export function isValidPermanentStudentId(value: string): boolean {
  return STUDENT_ID_RE.test(value.trim())
}

/** Resolve a permanent student ID to profile + original application education fields. */
export async function lookupReturningStudentByPermanentId(
  supabase: SupabaseClient,
  permanentStudentId: string,
): Promise<ReturningStudentContext | null> {
  const trimmed = permanentStudentId.trim().toUpperCase()
  if (!isValidPermanentStudentId(trimmed)) return null

  const { data: student } = await supabase
    .from('students')
    .select(
      `
      id,
      student_id,
      auth_user_id,
      full_name,
      real_email,
      phone,
      date_of_birth,
      gender,
      country,
      address,
      state_region,
      city,
      application_id,
      is_active
    `,
    )
    .eq('student_id', trimmed)
    .maybeSingle()

  if (!student?.is_active) return null

  const { data: application } = await supabase
    .from('applications')
    .select('qualification, institution, year_completed, prior_experience')
    .eq('id', student.application_id)
    .maybeSingle()

  if (!application) return null

  return {
    studentDbId: student.id,
    permanentStudentId: student.student_id,
    authUserId: student.auth_user_id,
    fullName: student.full_name,
    realEmail: student.real_email,
    phone: student.phone,
    dateOfBirth: student.date_of_birth,
    gender: student.gender,
    country: student.country,
    address: student.address,
    stateRegion: student.state_region,
    city: student.city,
    qualification: application.qualification,
    institution: application.institution,
    yearCompleted: application.year_completed,
    priorExperience: application.prior_experience,
  }
}
