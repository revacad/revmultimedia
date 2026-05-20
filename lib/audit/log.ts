import { createAdminClient } from '@/lib/supabase/admin'

export type AuditLogParams = {
  adminId?: string | null
  action: string
  entityType?: string
  entityId?: string | null
  oldValue?: unknown
  newValue?: unknown
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('audit_logs').insert({
    admin_id: params.adminId ?? null,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
  })

  if (error) {
    console.error('[audit] log failed', error)
  }
}
