import { createAdminClient } from '@/lib/supabase/admin'
import { clearSessionBinding } from '@/lib/auth/session-binding'

/** Revoke all refresh tokens for this user (all devices). */
export async function invalidateAllAuthSessions(authUserId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.auth.admin.signOut(authUserId, 'global')
  await clearSessionBinding(authUserId)
}
