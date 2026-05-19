'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { invalidateSystemSettings } from '@/lib/redis/invalidate'

export async function updateSettings(
  updates: Record<string, string>,
): Promise<{ success: true } | { error: string }> {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    for (const [key, value] of Object.entries(updates)) {
      const { error } = await supabase
        .from('system_settings')
        .update({
          value,
          updated_at: new Date().toISOString(),
          updated_by: admin?.id ?? null,
        })
        .eq('key', key)

      if (error) {
        return { error: error.message }
      }
    }

    invalidateSystemSettings()
    revalidatePath('/admin/settings')
    return { success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to update settings',
    }
  }
}
