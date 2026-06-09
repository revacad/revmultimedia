import type { SupabaseClient } from '@supabase/supabase-js'

export type StudentCertificate = {
  id: string
  r2Key: string
  fileName: string
  uploadedAt: string | null
  courseTitle: string | null
}

/** Certificates uploaded by admins for any student row owned by this auth user. */
export async function fetchStudentCertificates(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<StudentCertificate[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select('id, r2_key, file_name, uploaded_at, courses(title), students!inner(auth_user_id)')
    .eq('students.auth_user_id', authUserId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('[documents] fetchStudentCertificates failed', {
      authUserId,
      message: error.message,
    })
    return []
  }

  return (data ?? []).map((row) => {
    const courseRaw = row.courses as { title: string } | { title: string }[] | null
    const course = Array.isArray(courseRaw) ? (courseRaw[0] ?? null) : courseRaw
    return {
      id: row.id as string,
      r2Key: row.r2_key as string,
      fileName: row.file_name as string,
      uploadedAt: (row.uploaded_at as string | null) ?? null,
      courseTitle: course?.title ?? null,
    }
  })
}
