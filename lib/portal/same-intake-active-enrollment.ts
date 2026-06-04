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

export async function findSameIntakeActiveEnrollment(
  supabase: SupabaseClient,
  studentDbId: string,
  intakeId: string,
): Promise<SameIntakeActiveEnrollment | null> {
  const { data, error } = await supabase
    .from('enrollments')
    .select(
      `
      id,
      courses(title),
      intakes(name)
    `,
    )
    .eq('student_id', studentDbId)
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
