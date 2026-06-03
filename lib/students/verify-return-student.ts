import type { SupabaseClient } from '@supabase/supabase-js'
import { isValidPermanentStudentId } from '@/lib/students/lookup-returning'

export type VerifyReturnStudentResult = {
  found: boolean
  firstName?: string
  enrollmentCount?: number
}

function firstNameFromFullName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return 'Student'
  return trimmed.split(/\s+/)[0] ?? 'Student'
}

/** Look up an active student by permanent student_id (e.g. REV2026000001). */
export async function verifyReturnStudentLookup(
  supabase: SupabaseClient,
  studentId: string,
): Promise<VerifyReturnStudentResult> {
  const normalized = studentId.trim().toUpperCase()
  if (!isValidPermanentStudentId(normalized)) {
    return { found: false }
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, full_name, student_id, is_active, application_id')
    .eq('student_id', normalized)
    .maybeSingle()

  if (studentError) {
    console.error('[verifyReturnStudent] student lookup failed', studentError)
    return { found: false }
  }

  if (!student?.is_active) {
    return { found: false }
  }

  const { count, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', student.id)
    .eq('status', 'active')

  if (enrollmentError) {
    console.error('[verifyReturnStudent] enrollments count failed', enrollmentError)
    return {
      found: true,
      firstName: firstNameFromFullName(student.full_name),
      enrollmentCount: 0,
    }
  }

  return {
    found: true,
    firstName: firstNameFromFullName(student.full_name),
    enrollmentCount: count ?? 0,
  }
}
