import type { SupabaseClient } from '@supabase/supabase-js'

export type ResourceVisibilityRow = {
  visibility: string
  course_id: string | null
  intake_id: string | null
  is_active?: boolean | null
}

/** Enrollment statuses that grant access to course/intake-scoped resources. */
export const RESOURCE_ACCESS_ENROLLMENT_STATUSES = ['active', 'completed'] as const

export async function resolveStudentDbIdsForAuthUser(
  admin: SupabaseClient,
  authUserId: string,
): Promise<string[]> {
  const { data, error } = await admin
    .from('students')
    .select('id')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[resources] student lookup failed', {
      authUserId,
      message: error.message,
    })
    return []
  }

  return (data ?? []).map((row) => row.id as string)
}

export async function assertStudentCanAccessResource(
  admin: SupabaseClient,
  studentDbIds: string[],
  resource: ResourceVisibilityRow,
): Promise<void> {
  if (resource.is_active === false) {
    console.error('[resources] access denied: resource inactive', {
      visibility: resource.visibility,
      courseId: resource.course_id,
      intakeId: resource.intake_id,
    })
    throw new Error('You do not have access to this resource.')
  }

  switch (resource.visibility) {
    case 'all_students':
      return

    case 'course_specific': {
      if (!resource.course_id) {
        console.error('[resources] access denied: course_specific without course_id')
        throw new Error('You do not have access to this resource.')
      }
      if (studentDbIds.length === 0) {
        console.error('[resources] access denied: no student records for course resource', {
          courseId: resource.course_id,
        })
        throw new Error(
          'Student profile not found. Contact support if you believe this is an error.',
        )
      }

      const { count, error } = await admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .in('student_id', studentDbIds)
        .eq('course_id', resource.course_id)
        .in('status', [...RESOURCE_ACCESS_ENROLLMENT_STATUSES])

      if (error || !count) {
        console.error('[resources] access denied: course enrollment mismatch', {
          studentDbIds,
          courseId: resource.course_id,
          enrollmentCount: count ?? 0,
          error: error?.message,
        })
        throw new Error('You do not have access to this resource.')
      }
      return
    }

    case 'intake_specific': {
      if (!resource.intake_id) {
        console.error('[resources] access denied: intake_specific without intake_id')
        throw new Error('You do not have access to this resource.')
      }
      if (studentDbIds.length === 0) {
        console.error('[resources] access denied: no student records for intake resource', {
          intakeId: resource.intake_id,
        })
        throw new Error(
          'Student profile not found. Contact support if you believe this is an error.',
        )
      }

      const { count, error } = await admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .in('student_id', studentDbIds)
        .eq('intake_id', resource.intake_id)
        .in('status', [...RESOURCE_ACCESS_ENROLLMENT_STATUSES])

      if (error || !count) {
        console.error('[resources] access denied: intake enrollment mismatch', {
          studentDbIds,
          intakeId: resource.intake_id,
          enrollmentCount: count ?? 0,
          error: error?.message,
        })
        throw new Error('You do not have access to this resource.')
      }
      return
    }

    default:
      console.error('[resources] access denied: unknown visibility', {
        visibility: resource.visibility,
      })
      throw new Error('You do not have access to this resource.')
  }
}
