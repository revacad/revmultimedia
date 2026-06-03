'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { r2DocumentHref } from '@/lib/r2/document-url'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'
import { sendAdminNewApplication } from '@/lib/notifications/email'
import { r2KeySchema } from '@/lib/validations/common'
import {
  updateProfilePhotoSchema,
  uploadStudentDocumentSchema,
} from '@/lib/validations/student'
import { isR2KeyOwnedByStudent } from '@/lib/students/student-document-key'
import { safeActionError } from '@/lib/errors/action'

async function requireOwnStudent(studentDbId: string) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' as const }
  }

  const admin = createAdminClient()
  const { data: student } = await admin
    .from('students')
    .select('id, auth_user_id, student_id, full_name')
    .eq('id', studentDbId)
    .maybeSingle()

  if (!student || student.auth_user_id !== user.id) {
    return { error: 'Unauthorized' as const }
  }

  return { student, user }
}

export async function getProfilePhotoUrl(r2Key: string): Promise<string | null> {
  const parsed = r2KeySchema.safeParse(r2Key)
  if (!parsed.success) return null

  return r2DocumentHref(normalizeR2ObjectKey(parsed.data))
}

export async function updateProfilePhoto(
  studentDbId: string,
  r2Key: string,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = updateProfilePhotoSchema.safeParse({ studentDbId, r2Key })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid profile photo details' }
  }

  const auth = await requireOwnStudent(studentDbId)
  if ('error' in auth && auth.error) {
    return { error: auth.error }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('students')
    .update({
      profile_photo_r2_key: parsed.data.r2Key,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentDbId)

  if (error) {
    return safeActionError('student.updateProfilePhoto', error, 'Failed to update profile photo.')
  }

  revalidatePath('/portal/dashboard')
  return { success: true }
}

export async function uploadStudentDocument(data: {
  studentDbId: string
  documentType: 'certificate' | 'other'
  r2Key: string
  fileName: string
  fileSize: number
  mimeType: string
}): Promise<{ error?: string; success?: boolean }> {
  const parsed = uploadStudentDocumentSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid document details' }
  }

  const payload = parsed.data

  const auth = await requireOwnStudent(payload.studentDbId)
  if ('error' in auth && auth.error) {
    return { error: auth.error }
  }

  if (!isR2KeyOwnedByStudent(payload.r2Key, auth.student.student_id)) {
    return { error: 'Unauthorized' }
  }

  const admin = createAdminClient()
  const { data: application } = await admin
    .from('applications')
    .select('id, reference')
    .eq('auth_user_id', auth.user!.id)
    .maybeSingle()

  const { error } = await admin.from('documents').insert({
    student_id: payload.studentDbId,
    application_id: application?.id ?? null,
    document_type: payload.documentType,
    r2_key: payload.r2Key,
    file_name: payload.fileName,
    file_size_bytes: payload.fileSize,
    mime_type: payload.mimeType,
    uploaded_by: 'student',
  })

  if (error) {
    return safeActionError('student.uploadDocument', error, 'Failed to upload document.')
  }

  if (application) {
    await sendAdminNewApplication({
      applicantName: auth.student!.full_name,
      reference: application.reference,
      course: `New document (${payload.documentType})`,
    }).catch(() => undefined)

    await admin.from('notifications_log').insert({
      application_id: application.id,
      student_id: data.studentDbId,
      channel: 'email',
      event_type: 'application_received',
      recipient: process.env.ADMIN_EMAIL ?? 'admin@revmultimediagh.com',
      status: 'sent',
    })
  }

  revalidatePath('/portal/documents')
  return { success: true }
}
