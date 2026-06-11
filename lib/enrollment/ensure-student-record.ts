import type { SupabaseClient } from '@supabase/supabase-js'

type StudentRow = { id: string; student_id: string }

type ApplicationForStudent = {
  id: string
  auth_user_id: string
  full_name: string
  real_email: string
  phone: string
  date_of_birth: string
  gender: string
  country: string
  address: string
  state_region: string | null
  city: string | null
  course_id: string
  intake_id: string
  returning_student_id: string | null
}

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

async function ensureEnrollmentForApplication(
  supabase: SupabaseClient,
  student: StudentRow,
  application: Pick<ApplicationForStudent, 'id' | 'course_id' | 'intake_id'>,
): Promise<void> {
  const { data: existingEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('application_id', application.id)
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
}

/** Ensures a students row exists for an accepted application (needed for enrollment letter + portal ID). */
export async function ensureStudentRecordForApplication(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<StudentRow | null> {
  const { data: application } = await supabase
    .from('applications')
    .select(
      `
      id, auth_user_id, full_name, real_email, phone, date_of_birth, gender,
      country, address, state_region, city, course_id, intake_id, returning_student_id
    `,
    )
    .eq('id', applicationId)
    .maybeSingle()

  if (!application?.auth_user_id) {
    console.error('[ensureStudentRecordForApplication] missing auth_user_id', applicationId)
    return null
  }

  const app = application as ApplicationForStudent

  if (app.returning_student_id) {
    const { data: returningStudent } = await supabase
      .from('students')
      .select('id, student_id')
      .eq('id', app.returning_student_id)
      .maybeSingle()

    if (returningStudent) {
      await ensureEnrollmentForApplication(supabase, returningStudent, app)
      return returningStudent
    }
  }

  const existingForApplication = await fetchStudentForApplication(supabase, applicationId)
  if (existingForApplication) {
    await ensureEnrollmentForApplication(supabase, existingForApplication, app)
    return existingForApplication
  }

  const { data: authStudent } = await supabase
    .from('students')
    .select('id, student_id')
    .eq('auth_user_id', app.auth_user_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (authStudent) {
    await ensureEnrollmentForApplication(supabase, authStudent, app)
    return authStudent
  }

  const { data: generatedId, error: rpcError } = await supabase.rpc('generate_student_id')
  if (rpcError || !generatedId) {
    console.error('[ensureStudentRecordForApplication] generate_student_id failed', rpcError)
    return null
  }

  const { error: upsertError } = await supabase.from('students').upsert(
    {
      student_id: generatedId as string,
      application_id: app.id,
      auth_user_id: app.auth_user_id,
      full_name: app.full_name,
      real_email: app.real_email,
      phone: app.phone,
      date_of_birth: app.date_of_birth,
      gender: app.gender,
      country: app.country,
      address: app.address,
      state_region: app.state_region,
      city: app.city,
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

  await ensureEnrollmentForApplication(supabase, student, app)

  return student
}
