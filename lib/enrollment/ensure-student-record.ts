import type { SupabaseClient } from '@supabase/supabase-js'

type StudentRow = { id: string; student_id: string }

async function fetchStudentForApplication(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<StudentRow | null> {
  const { data } = await supabase
    .from('students')
    .select('id, student_id')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return data
}

/** Ensures a students row exists for an accepted application (needed for enrollment letter + portal ID). */
export async function ensureStudentRecordForApplication(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<StudentRow | null> {
  const existing = await fetchStudentForApplication(supabase, applicationId)
  if (existing) {
    return existing
  }

  const { data: application } = await supabase
    .from('applications')
    .select(
      `
      id, auth_user_id, full_name, real_email, phone, date_of_birth, gender,
      country, address, state_region, city, course_id, intake_id
    `,
    )
    .eq('id', applicationId)
    .maybeSingle()

  if (!application?.auth_user_id) {
    console.error('[ensureStudentRecordForApplication] missing auth_user_id', applicationId)
    return null
  }

  const { data: generatedId, error: rpcError } = await supabase.rpc('generate_student_id')
  if (rpcError || !generatedId) {
    console.error('[ensureStudentRecordForApplication] generate_student_id failed', rpcError)
    return null
  }

  const { error: upsertError } = await supabase.from('students').upsert(
    {
      student_id: generatedId as string,
      application_id: application.id,
      auth_user_id: application.auth_user_id,
      full_name: application.full_name,
      real_email: application.real_email,
      phone: application.phone,
      date_of_birth: application.date_of_birth,
      gender: application.gender,
      country: application.country,
      address: application.address,
      state_region: application.state_region,
      city: application.city,
    },
    { onConflict: 'application_id', ignoreDuplicates: true },
  )

  if (upsertError) {
    console.error('[ensureStudentRecordForApplication] upsert failed', upsertError)
  }

  const student = await fetchStudentForApplication(supabase, applicationId)
  if (!student) {
    return null
  }

  const { data: existingEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('application_id', applicationId)
    .order('enrolled_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!existingEnrollment) {
    await supabase.from('enrollments').insert({
      student_id: student.id,
      course_id: application.course_id,
      intake_id: application.intake_id,
      application_id: application.id,
      status: 'active',
    })
  }

  return student
}
