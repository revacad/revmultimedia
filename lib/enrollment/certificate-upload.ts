import type { SupabaseClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/errors/log'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export const CERTIFICATE_UPLOAD_REQUIRES_ENROLLMENT_MESSAGE =
  'Certificate upload is only available after the student is enrolled (partial tuition paid and enrollment letter sent).'

export function isApplicationEnrolled(enrolledAt: string | null | undefined): boolean {
  return enrolledAt != null && enrolledAt !== ''
}

export async function assertCanUploadCertificate(
  supabase: SupabaseClient,
  enrollmentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select('id, applications(enrolled_at)')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (error) {
    logServerError('enrollment/certificate-upload', error)
    return { ok: false, error: 'Unable to verify enrolment. Please try again.' }
  }

  if (!enrollment) {
    return { ok: false, error: 'Enrolment not found' }
  }

  const application = firstRelation(
    enrollment.applications as { enrolled_at: string | null } | { enrolled_at: string | null }[] | null,
  )

  if (!isApplicationEnrolled(application?.enrolled_at)) {
    return { ok: false, error: CERTIFICATE_UPLOAD_REQUIRES_ENROLLMENT_MESSAGE }
  }

  return { ok: true }
}
