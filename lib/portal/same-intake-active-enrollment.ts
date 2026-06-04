import type { SupabaseClient } from '@supabase/supabase-js'

export type SameIntakeActiveEnrollment = {
  enrollmentId: string
  existingCourseTitle: string
  intakeName: string
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

/** Active enrollment in the same intake for any student row tied to this auth user. */
export async function findSameIntakeActiveEnrollment(
  supabase: SupabaseClient,
  authUserId: string,
  intakeId: string,
): Promise<SameIntakeActiveEnrollment | null> {
  const { data: studentRows, error: studentsError } = await supabase
    .from('students')
    .select('id')
    .eq('auth_user_id', authUserId)

  if (studentsError || !studentRows?.length) return null

  const studentIds = studentRows.map((row) => row.id)

  const { data, error } = await supabase
    .from('enrollments')
    .select(
      `
      id,
      courses(title),
      intakes(name)
    `,
    )
    .in('student_id', studentIds)
    .eq('intake_id', intakeId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const course = firstRelation(data.courses as { title: string } | { title: string }[] | null)
  const intake = firstRelation(data.intakes as { name: string } | { name: string }[] | null)

  if (!course?.title || !intake?.name) return null

  return {
    enrollmentId: data.id as string,
    existingCourseTitle: course.title,
    intakeName: intake.name,
  }
}
