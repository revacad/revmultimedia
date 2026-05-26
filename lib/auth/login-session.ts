import { headers } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { bindSession } from '@/lib/auth/session-binding'

function requestMetaFromHeaders(headersList: Headers): { ip: string; userAgent: string } {
  return {
    ip:
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'anonymous',
    userAgent: headersList.get('user-agent') ?? '',
  }
}

/** Clear any pre-login cookies, then sign in (mitigates session fixation). */
export async function signInWithFreshSession(
  supabase: SupabaseClient,
  credentials: { email: string; password: string },
) {
  await supabase.auth.signOut({ scope: 'local' })
  return supabase.auth.signInWithPassword(credentials)
}

export async function onLoginSuccess(userId: string): Promise<void> {
  const { ip, userAgent } = requestMetaFromHeaders(await headers())
  await bindSession(userId, ip, userAgent)
}
