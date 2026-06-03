import type { SupabaseClient } from '@supabase/supabase-js'

export type ResourceVisibilityRow = {
  visibility: string
  course_id: string | null
  intake_id: string | null
  is_active?: boolean | null
}

export async function assertStudentCanAccessResource(
  admin: SupabaseClient,
  studentDbId: string,
  resource: ResourceVisibilityRow,
): Promise<void> {
  if (resource.is_active === false) {
    throw new Error('You do not have access to this resource.')
  }

  switch (resource.visibility) {
    case 'all_students':
      return

    case 'course_specific': {
      if (!resource.course_id) {
        throw new Error('You do not have access to this resource.')
      }
      const { count, error } = await admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentDbId)
        .eq('course_id', resource.course_id)
        .eq('status', 'active')

      if (error || !count) {
        throw new Error('You do not have access to this resource.')
      }
      return
    }

    case 'intake_specific': {
      if (!resource.intake_id) {
        throw new Error('You do not have access to this resource.')
      }
      const { count, error } = await admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentDbId)
        .eq('intake_id', resource.intake_id)
        .eq('status', 'active')

      if (error || !count) {
        throw new Error('You do not have access to this resource.')
      }
      return
    }

    default:
      throw new Error('You do not have access to this resource.')
  }
}
