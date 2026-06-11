import { createServerClient } from '@/lib/supabase/server'

const EPOCH_ISO = '1970-01-01T00:00:00.000Z'

export async function getUnreadApplicationsCount(adminId: string): Promise<number> {
  const supabase = await createServerClient()

  const { data: lastSeen, error: lastSeenError } = await supabase
    .from('admin_applications_last_seen')
    .select('last_seen_at')
    .eq('admin_id', adminId)
    .maybeSingle()

  if (lastSeenError) {
    console.error('[applications-last-seen] last_seen lookup failed', lastSeenError)
    return 0
  }

  const since = lastSeen?.last_seen_at ?? EPOCH_ISO

  const { count, error: countError } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .gt('created_at', since)

  if (countError) {
    console.error('[applications-last-seen] count failed', countError)
    return 0
  }

  return count ?? 0
}

export async function markApplicationsAsSeen(adminId: string): Promise<void> {
  const supabase = await createServerClient()
  const now = new Date().toISOString()

  const { error } = await supabase.from('admin_applications_last_seen').upsert(
    {
      admin_id: adminId,
      last_seen_at: now,
      updated_at: now,
    },
    { onConflict: 'admin_id' },
  )

  if (error) {
    console.error('[applications-last-seen] mark seen failed', error)
  }
}
