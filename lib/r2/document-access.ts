import type { SupabaseClient } from '@supabase/supabase-js'
import { isCourseMediaR2Key } from '@/lib/r2/course-media-urls'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'

async function userOwnsApplication(
  admin: SupabaseClient,
  userId: string,
  applicationId: string,
): Promise<boolean> {
  const { data: application } = await admin
    .from('applications')
    .select('auth_user_id, internal_email')
    .eq('id', applicationId)
    .maybeSingle()

  if (!application) return false
  if (application.auth_user_id === userId) return true

  return false
}

async function userOwnsStudentRow(
  admin: SupabaseClient,
  userId: string,
  studentDbId: string,
): Promise<boolean> {
  const { data: student } = await admin
    .from('students')
    .select('auth_user_id')
    .eq('id', studentDbId)
    .maybeSingle()

  return student?.auth_user_id === userId
}

async function userOwnsInvoiceRecord(
  admin: SupabaseClient,
  userId: string,
  invoice: { application_id: string; student_id: string | null },
): Promise<boolean> {
  if (await userOwnsApplication(admin, userId, invoice.application_id)) {
    return true
  }
  if (invoice.student_id) {
    return userOwnsStudentRow(admin, userId, invoice.student_id)
  }
  return false
}

/** Published course thumbnails and instructor photos (legacy /api/r2/document links). */
async function isPublishedCourseMediaKey(
  admin: SupabaseClient,
  key: string,
): Promise<boolean> {
  if (!isCourseMediaR2Key(key)) return false

  const courseId =
    key.match(/^courses\/([0-9a-f-]{36})\//i)?.[1] ??
    key.match(/^courses\/thumbnails\/([0-9a-f-]{36})\./i)?.[1]

  if (!courseId) {
    return key.startsWith('courses/thumbnails/')
  }

  const { data: course } = await admin
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('is_published', true)
    .maybeSingle()

  return Boolean(course)
}

async function userOwnsInvoiceByReference(
  admin: SupabaseClient,
  userId: string,
  invoiceReference: string,
): Promise<boolean> {
  const { data: invoice } = await admin
    .from('invoices')
    .select('application_id, student_id')
    .eq('reference', invoiceReference)
    .maybeSingle()

  if (!invoice) return false
  return userOwnsInvoiceRecord(admin, userId, invoice)
}

/**
 * Returns true when the user may download/view the private-bucket object.
 * Active admins (admin + superadmin roles) always pass.
 */
export async function userCanAccessR2Object(
  admin: SupabaseClient,
  userId: string,
  rawKey: string,
): Promise<boolean> {
  const key = normalizeR2ObjectKey(rawKey)
  if (!key) return false

  const { data: adminRow } = await admin
    .from('admins')
    .select('id')
    .eq('auth_user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (adminRow) return true

  if (await isPublishedCourseMediaKey(admin, key)) return true

  const { data: doc } = await admin
    .from('documents')
    .select('application_id, student_id')
    .eq('r2_key', key)
    .maybeSingle()

  if (doc) {
    if (doc.application_id && (await userOwnsApplication(admin, userId, doc.application_id))) {
      return true
    }
    if (doc.student_id && (await userOwnsStudentRow(admin, userId, doc.student_id))) {
      return true
    }
  }

  const { data: cert } = await admin
    .from('certificates')
    .select('students(auth_user_id)')
    .eq('r2_key', key)
    .maybeSingle()

  const certStudentRaw = cert?.students
  const certStudent = Array.isArray(certStudentRaw)
    ? certStudentRaw[0]
    : certStudentRaw
  if (
    certStudent &&
    typeof certStudent === 'object' &&
    'auth_user_id' in certStudent &&
    certStudent.auth_user_id === userId
  ) {
    return true
  }

  const { data: invoice } = await admin
    .from('invoices')
    .select('application_id, student_id')
    .eq('r2_key', key)
    .maybeSingle()

  if (invoice && (await userOwnsInvoiceRecord(admin, userId, invoice))) {
    return true
  }

  const { data: applicationLetter } = await admin
    .from('applications')
    .select('auth_user_id')
    .eq('admission_letter_r2_key', key)
    .maybeSingle()

  if (applicationLetter?.auth_user_id === userId) return true

  const { data: studentPhoto } = await admin
    .from('students')
    .select('auth_user_id')
    .eq('profile_photo_r2_key', key)
    .maybeSingle()

  if (studentPhoto?.auth_user_id === userId) return true

  const invoicePathMatch = key.match(/^invoices\/([^/]+)\//)
  if (invoicePathMatch?.[1]) {
    if (await userOwnsInvoiceByReference(admin, userId, invoicePathMatch[1])) {
      return true
    }
  }

  const { data: resource } = await admin
    .from('resources')
    .select('id')
    .eq('file_r2_key', key)
    .maybeSingle()

  if (resource) {
    const { data: student } = await admin
      .from('students')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle()
    if (student) return true
  }

  return false
}
