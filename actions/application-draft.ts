'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getClientIp } from '@/lib/auth/getClientIp'
import { checkRateLimit, applicationDraftCreateLimit } from '@/lib/redis/ratelimit'
import { logServerError } from '@/lib/errors/log'

export type ApplicationDraftCredentials = {
  draftId: string
  uploadToken: string
}

export async function createApplicationDraft(): Promise<ApplicationDraftCredentials> {
  const ip = await getClientIp()
  const { allowed } = await checkRateLimit(applicationDraftCreateLimit, ip ?? 'unknown')
  if (!allowed) {
    throw new Error('Too many requests. Please try again later.')
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('application_drafts')
    .insert({})
    .select('id, upload_token')
    .single()

  if (error || !data) {
    logServerError('application-draft.create', error)
    throw new Error('Unable to start application. Please refresh and try again.')
  }

  return {
    draftId: data.id,
    uploadToken: data.upload_token,
  }
}
