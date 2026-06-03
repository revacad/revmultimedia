import type { SupabaseClient } from '@supabase/supabase-js'
import type { ReturningStudentContext } from '@/lib/students/lookup-returning'

/** Attach a new application to an existing enrolled student (reuse portal auth). */
export async function linkApplicationToReturningStudent(
  supabase: SupabaseClient,
  applicationId: string,
  returning: ReturningStudentContext,
): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({
      returning_student_id: returning.studentDbId,
      auth_user_id: returning.authUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) {
    console.error('[linkApplicationToReturningStudent] failed', error)
    throw new Error('Could not link application to student record')
  }
}
