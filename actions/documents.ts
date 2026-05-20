'use server'

import { generatePresignedDownloadUrl } from '@/lib/r2/presign'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getDocumentUrl(r2Key: string): Promise<string> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const adminClient = createAdminClient()
  const { data: doc } = await adminClient
    .from('documents')
    .select('id, application_id, student_id')
    .eq('r2_key', r2Key)
    .single()

  if (!doc) throw new Error('Document not found')

  let isOwner = false

  if (doc.application_id) {
    const { data: application } = await adminClient
      .from('applications')
      .select('auth_user_id')
      .eq('id', doc.application_id)
      .single()
    isOwner = application?.auth_user_id === user.id
  }

  if (!isOwner && doc.student_id) {
    const { data: student } = await adminClient
      .from('students')
      .select('auth_user_id')
      .eq('id', doc.student_id)
      .single()
    isOwner = student?.auth_user_id === user.id
  }

  const { data: admin } = await adminClient
    .from('admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!isOwner && !admin) {
    throw new Error('Access denied')
  }

  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  if (!bucket) {
    throw new Error('R2 bucket is not configured')
  }

  return generatePresignedDownloadUrl(bucket, r2Key, 900)
}
