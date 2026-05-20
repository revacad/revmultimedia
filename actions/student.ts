'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { generatePresignedDownloadUrl } from '@/lib/r2/presign'
import { sendAdminNewApplication } from '@/lib/notifications/email'

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
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  if (!bucket || !r2Key) return null
  return generatePresignedDownloadUrl(bucket, r2Key, 3600)
}

export async function updateProfilePhoto(
  studentDbId: string,
  r2Key: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireOwnStudent(studentDbId)
  if ('error' in auth && auth.error) {
    return { error: auth.error }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('students')
    .update({
      profile_photo_r2_key: r2Key,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentDbId)

  if (error) {
    return { error: error.message }
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
  const auth = await requireOwnStudent(data.studentDbId)
  if ('error' in auth && auth.error) {
    return { error: auth.error }
  }

  const admin = createAdminClient()
  const { data: application } = await admin
    .from('applications')
    .select('id, reference')
    .eq('auth_user_id', auth.user!.id)
    .maybeSingle()

  const { error } = await admin.from('documents').insert({
    student_id: data.studentDbId,
    application_id: application?.id ?? null,
    document_type: data.documentType,
    r2_key: data.r2Key,
    file_name: data.fileName,
    file_size_bytes: data.fileSize,
    mime_type: data.mimeType,
    uploaded_by: 'student',
  })

  if (error) {
    return { error: error.message }
  }

  if (application) {
    await sendAdminNewApplication({
      applicantName: auth.student!.full_name,
      reference: application.reference,
      course: `New document (${data.documentType})`,
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
