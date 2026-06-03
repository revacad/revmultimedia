import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logServerError } from '@/lib/errors/log'

const DRAFT_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000

export async function verifyDraftUploadToken(
  draftId: string,
  uploadToken: string,
): Promise<boolean> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('application_drafts')
    .select('id, upload_token, created_at')
    .eq('id', draftId)
    .maybeSingle()

  if (error) {
    logServerError('apply/draft-upload-token', error, { draftId })
    return false
  }

  if (!data || data.upload_token !== uploadToken) {
    return false
  }

  const createdAt = new Date(data.created_at).getTime()
  if (Number.isNaN(createdAt) || Date.now() - createdAt > DRAFT_UPLOAD_TTL_MS) {
    return false
  }

  return true
}

/** Returns a 401 response when the draft upload token is missing or invalid. */
export async function assertDraftUploadAuthorized(
  request: Request,
  draftId: string,
): Promise<NextResponse | null> {
  const uploadToken = request.headers.get('x-upload-token')?.trim()
  if (!uploadToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const valid = await verifyDraftUploadToken(draftId, uploadToken)
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
