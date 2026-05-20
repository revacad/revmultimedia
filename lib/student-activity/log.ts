import { createAdminClient } from '@/lib/supabase/admin'

export async function logStudentActivity(params: {
  studentId: string
  action: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('student_activity_logs').insert({
    student_id: params.studentId,
    action: params.action,
    metadata: params.metadata ?? null,
  })

  if (error) {
    console.error('[student-activity] log failed', error)
  }
}
