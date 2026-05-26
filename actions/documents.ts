'use server'

import { generatePresignedDownloadUrl } from '@/lib/r2/presign'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDocumentUrlSchema } from '@/lib/validations/documents'

export async function getDocumentUrl(r2Key: string): Promise<string> {
  const parsed = getDocumentUrlSchema.safeParse({ r2Key })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid file key')
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const adminClient = createAdminClient()
  const key = parsed.data.r2Key

  const { data: doc } = await adminClient
    .from('documents')
    .select('id, application_id, student_id')
    .eq('r2_key', key)
    .maybeSingle()

  type CertificateLookupRow = {
    id: string
    students: { auth_user_id: string } | null
  }

  let cert: CertificateLookupRow | null = null
  if (!doc) {
    const { data } = await adminClient
      .from('certificates')
      .select('id, students(auth_user_id)')
      .eq('r2_key', key)
      .maybeSingle()
    cert = data as CertificateLookupRow | null
  }

  if (!doc && !cert) throw new Error('Document not found')

  const { data: admin } = await adminClient
    .from('admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!admin) {
    if (doc) {
      let isOwner = false

      if (doc.application_id) {
        const { data: application } = await adminClient
          .from('applications')
          .select('auth_user_id')
          .eq('id', doc.application_id)
          .maybeSingle()
        isOwner = application?.auth_user_id === user.id
      }

      if (!isOwner && doc.student_id) {
        const { data: student } = await adminClient
          .from('students')
          .select('auth_user_id')
          .eq('id', doc.student_id)
          .maybeSingle()
        isOwner = student?.auth_user_id === user.id
      }

      if (!isOwner) throw new Error('Access denied')
    } else {
      if (cert?.students?.auth_user_id !== user.id) throw new Error('Access denied')
    }
  }

  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  if (!bucket) {
    throw new Error('R2 bucket is not configured')
  }

  return generatePresignedDownloadUrl(bucket, key, 900)
}
