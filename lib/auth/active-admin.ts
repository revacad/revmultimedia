import { createAdminClient } from '@/lib/supabase/admin'

/** True when auth user has an active row in `admins` (service role; not JWT role). */
export async function hasActiveAdminProfile(authUserId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .eq('auth_user_id', authUserId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('[auth] active admin check failed', error)
    return false
  }

  return Boolean(data)
}
