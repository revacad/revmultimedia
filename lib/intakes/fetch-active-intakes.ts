import { createPublicClient } from '@/lib/supabase/public'
import { withCache } from '@/lib/redis/cache'
import { todayDateString } from '@/lib/intakes/lifecycle'
import type { Intake } from '@/lib/courses/types'

const ACTIVE_INTAKES_CACHE_KEY = 'public:intakes:active'
const ACTIVE_INTAKES_TTL_SECONDS = 120

export async function fetchCachedActiveIntakes(): Promise<Intake[]> {
  return withCache(ACTIVE_INTAKES_CACHE_KEY, ACTIVE_INTAKES_TTL_SECONDS, async () => {
    const supabase = createPublicClient()
    const today = todayDateString()
    const { data, error } = await supabase
      .from('intakes')
      .select(
        'id, course_id, name, start_date, end_date, application_deadline, max_slots, enrolled_count, is_closed',
      )
      .eq('is_closed', false)
      .gte('end_date', today)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('[intakes] fetchCachedActiveIntakes failed', error)
      return []
    }

    return (data ?? []) as Intake[]
  })
}
