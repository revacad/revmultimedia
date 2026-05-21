import { createAdminClient } from '@/lib/supabase/admin'
import { runAfterResponse } from '@/lib/background'

export type AuditLogParams = {
  adminId?: string | null
  action: string
  entityType?: string
  entityId?: string | null
  oldValue?: unknown
  newValue?: unknown
}

export type AuditLogEntry = AuditLogParams

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('audit_logs').insert({
    admin_id: params.adminId ?? null,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id:
      params.entityId != null && params.entityId !== ''
        ? String(params.entityId)
        : null,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
  })

  if (error) {
    console.error('[audit] log failed', error)
  }
}

export function logAuditEventBackground(entry: AuditLogEntry): void {
  runAfterResponse(async () => {
    await logAuditEvent(entry)
  })
}
