'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getClientIp } from '@/lib/auth/getClientIp'
import { checkRateLimit, verifyReturnStudentLimit } from '@/lib/redis/ratelimit'
import { isValidPermanentStudentId } from '@/lib/students/lookup-returning'
import {
  verifyReturnStudentLookup,
  type VerifyReturnStudentResult,
} from '@/lib/students/verify-return-student'

export async function verifyReturnStudent(studentId: string): Promise<VerifyReturnStudentResult> {
  const normalized = studentId.trim().toUpperCase()
  if (!isValidPermanentStudentId(normalized)) {
    return { found: false }
  }

  const ip = await getClientIp()
  const { allowed } = await checkRateLimit(verifyReturnStudentLimit, ip ?? 'unknown')
  if (!allowed) {
    return { found: false }
  }

  const supabase = createAdminClient()
  return verifyReturnStudentLookup(supabase, normalized)
}
