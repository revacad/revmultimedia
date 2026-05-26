'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { invalidateSystemSettings } from '@/lib/redis/invalidate'
import { updateSettingsSchema } from '@/lib/validations/settings'

export async function updateSettings(
  updates: Record<string, string> | { key: string; value: string }[],
): Promise<{ success: true } | { error: string }> {
  try {
    const session = await requireAdmin()
    if (session.role !== 'superadmin') {
      return { error: 'Unauthorized' }
    }

    const parsed = updateSettingsSchema.safeParse(updates)
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid settings update',
      }
    }

    const supabase = createAdminClient()

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    const entries = Array.isArray(parsed.data)
      ? parsed.data.map((row) => [row.key, row.value] as const)
      : Object.entries(parsed.data)

    for (const [key, value] of entries) {
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
