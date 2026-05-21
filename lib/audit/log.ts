import { createAdminClient } from '@/lib/supabase/admin'

export type AuditLogParams = {
  adminId?: string | null
  action: string
  entityType?: string
  entityId?: string | null
  oldValue?: unknown
  newValue?: unknown
}

export type AuditLogEntry = AuditLogParams

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from('audit_logs').insert({
      admin_id: entry.adminId || null,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ? String(entry.entityId) : null,
      old_value: entry.oldValue ?? null,
      new_value: entry.newValue ?? null,
    })

    if (error) {
      console.error('Audit log INSERT error:', JSON.stringify(error))
    }
  } catch (err) {
    console.error('Audit log EXCEPTION:', err)
  }
}

/** @deprecated Use await logAuditEvent() synchronously instead. */
export async function logAuditEventBackground(entry: AuditLogEntry): Promise<void> {
  await logAuditEvent(entry)
}
