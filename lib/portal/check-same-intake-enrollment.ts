import type { SupabaseClient } from '@supabase/supabase-js'

export type SameIntakeConflict = {
  courseTitle: string
  message: string
}

function courseTitleFromRelation(
  courses: { title: string } | { title: string }[] | null | undefined,
): string | null {
  if (!courses) return null
  if (Array.isArray(courses)) return courses[0]?.title ?? null
  return courses.title ?? null
}

function buildConflict(courseTitle: string): SameIntakeConflict {
  return {
    courseTitle,
    message: `You are already enrolled in ${courseTitle} for this intake. You cannot apply for two courses in the same intake. Please select a different intake.`,
  }
}

function mapEnrollmentRow(
  data: { courses: { title: string } | { title: string }[] | null } | null,
): SameIntakeConflict | null {
  if (!data) return null
  const courseTitle = courseTitleFromRelation(data.courses)
  return courseTitle ? buildConflict(courseTitle) : null
}

/** One query: any student row for this auth user with an active enrollment in the intake. */
export async function findSameIntakeEnrollmentConflictByAuthUser(
  supabase: SupabaseClient,
  authUserId: string,
  intakeId: string,
): Promise<SameIntakeConflict | null> {
  if (!intakeId || !authUserId) return null

  const { data, error } = await supabase
    .from('enrollments')
    .select('id, courses(title), students!inner(auth_user_id)')
    .eq('students.auth_user_id', authUserId)
    .eq('intake_id', intakeId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[checkSameIntakeEnrollment] auth user query failed', {
      authUserId,
      intakeId,
      error,
    })
    return null
  }

  return mapEnrollmentRow(data)
}

/** One query: any listed student PK with an active enrollment in the intake. */
export async function findSameIntakeEnrollmentConflict(
  supabase: SupabaseClient,
  studentPrimaryKeys: string[],
  intakeId: string,
): Promise<SameIntakeConflict | null> {
  if (!intakeId || studentPrimaryKeys.length === 0) return null

  const { data, error } = await supabase
    .from('enrollments')
    .select('id, courses(title)')
    .in('student_id', studentPrimaryKeys)
    .eq('intake_id', intakeId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[checkSameIntakeEnrollment] student PK query failed', {
      intakeId,
      error,
    })
    return null
  }

  return mapEnrollmentRow(data)
}
