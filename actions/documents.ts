'use server'

import { createServerClient } from '@/lib/supabase/server'
import { r2DocumentHref } from '@/lib/r2/document-url'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'
import { getDocumentUrlSchema } from '@/lib/validations/documents'

/** Returns a same-origin URL that checks auth then redirects to a short-lived presigned R2 URL. */
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

  return r2DocumentHref(normalizeR2ObjectKey(parsed.data.r2Key))
}
