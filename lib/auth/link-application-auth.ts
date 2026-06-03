import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseErrorFields } from '@/lib/logging/redact'

/** Link an application row to the Supabase auth user (required for portal RLS). */
export async function linkApplicationAuthUser(
  supabase: SupabaseClient,
  applicationId: string,
  authUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ auth_user_id: authUserId })
    .eq('id', applicationId)
    .is('auth_user_id', null)

  if (error) {
    console.error('[linkApplicationAuthUser]', supabaseErrorFields(error))
  }
}

/** Backfill auth_user_id for applicants who can sign in but were never linked. */
export async function linkApplicationByInternalEmail(
  supabase: SupabaseClient,
  authUserId: string,
  internalEmail: string,
): Promise<void> {
  const email = internalEmail.trim().toLowerCase()
  if (!email) return

  const { error } = await supabase
    .from('applications')
    .update({ auth_user_id: authUserId })
    .ilike('internal_email', email)
    .is('auth_user_id', null)

  if (error) {
    console.error('[linkApplicationByInternalEmail]', supabaseErrorFields(error))
  }
}

async function findAuthUserIdByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const target = email.trim().toLowerCase()
  let page = 1

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) {
      console.error('[findAuthUserIdByEmail]', supabaseErrorFields(error))
      return null
    }

    const match = data.users.find((u) => u.email?.toLowerCase() === target)
    if (match?.id) return match.id

    if (data.users.length < 200) break
    page += 1
  }

  return null
}

/** Create portal auth user after apply submit and link application.auth_user_id. */
export async function createApplicantAuthUserAndLink(
  supabase: SupabaseClient,
  applicationId: string,
  reference: string,
  password: string,
): Promise<void> {
  const domain = process.env.INTERNAL_EMAIL_DOMAIN
  if (!domain) {
    console.error('[createApplicantAuthUserAndLink] INTERNAL_EMAIL_DOMAIN is not set')
    return
  }

  const internalEmail = `${reference}@${domain}`

  const { data, error } = await supabase.auth.admin.createUser({
    email: internalEmail,
    password,
    email_confirm: true,
  })

  let authUserId = data.user?.id ?? null

  if (!authUserId && error) {
    const alreadyExists =
      error.message.includes('already registered') ||
      error.message.includes('already been registered')
    if (alreadyExists) {
      authUserId = await findAuthUserIdByEmail(supabase, internalEmail)
    } else {
      console.error('[createApplicantAuthUserAndLink] createUser failed', supabaseErrorFields(error))
      return
    }
  }

  if (!authUserId) {
    console.error('[createApplicantAuthUserAndLink] no auth user id', { reference })
    return
  }

  await linkApplicationAuthUser(supabase, applicationId, authUserId)
}
