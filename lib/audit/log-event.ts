import { createAdminClient } from '@/lib/supabase/admin'
import { getClientIp } from '@/lib/auth/getClientIp'
import { redactSensitive, supabaseErrorFields } from '@/lib/logging/redact'

export type AuditActorType = 'admin' | 'student'

export type AuditAction =
  | 'portal_login'
  | 'portal_login_failed'
  | 'admin_login'
  | 'status_changed'
  | 'enrollment_letter_sent'
  | 'payment_confirmed'
  | 'invoice_created'
  | 'admin_invited'
  | 'admin_role_changed'
  | 'data_exported'
  | 'deletion_requested'
  | 'deletion_completed'
  | 'unauthorized_access_attempt'
  | (string & {})

export type LogAuditEventParams = {
  actorId?: string | null
  actorType?: AuditActorType | null
  action: AuditAction
  targetType?: string | null
  targetId?: string | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  /** @deprecated Use metadata */
  oldValue?: unknown
  /** @deprecated Use metadata */
  newValue?: unknown
  /** @deprecated Use actorId + actorType admin */
  adminId?: string | null
  /** @deprecated Use targetType */
  entityType?: string | null
  /** @deprecated Use targetId */
  entityId?: string | null
}

function buildMetadata(params: LogAuditEventParams): Record<string, unknown> | null {
  if (params.metadata && Object.keys(params.metadata).length > 0) {
    return params.metadata
  }
  if (params.oldValue !== undefined || params.newValue !== undefined) {
    return {
      ...(params.oldValue !== undefined ? { old: params.oldValue } : {}),
      ...(params.newValue !== undefined ? { new: params.newValue } : {}),
    }
  }
  return null
}

function resolveActor(params: LogAuditEventParams): {
  adminId: string | null
  actorId: string | null
  actorType: AuditActorType | null
} {
  if (params.actorType === 'student' && params.actorId) {
    return { adminId: null, actorId: params.actorId, actorType: 'student' }
  }

  if (params.actorType === 'admin' && params.actorId) {
    return { adminId: params.actorId, actorId: params.actorId, actorType: 'admin' }
  }

  if (params.adminId) {
    return {
      adminId: params.adminId,
      actorId: params.adminId,
      actorType: 'admin',
    }
  }

  return { adminId: null, actorId: null, actorType: params.actorType ?? null }
}

/**
 * Inserts a security-relevant event into audit_logs (service role).
 * Never throws — failures are logged to console only.
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    const supabase = createAdminClient()
    const actor = resolveActor(params)
    const targetType = params.targetType ?? params.entityType ?? null
    const targetId = params.targetId ?? params.entityId ?? null
    const metadata = buildMetadata(params)

    let ipAddress = params.ipAddress ?? null
    if (!ipAddress) {
      try {
        ipAddress = await getClientIp()
      } catch {
        ipAddress = null
      }
    }

    const { error } = await supabase.from('audit_logs').insert({
      admin_id: actor.adminId,
      actor_id: actor.actorId,
      actor_type: actor.actorType,
      action: params.action,
      entity_type: targetType,
      entity_id: targetId ? String(targetId) : null,
      old_value:
        params.oldValue !== undefined
          ? (redactSensitive(params.oldValue) as Record<string, unknown>)
          : null,
      new_value:
        params.newValue !== undefined
          ? (redactSensitive(params.newValue) as Record<string, unknown>)
          : null,
      metadata: metadata ? (redactSensitive(metadata) as Record<string, unknown>) : null,
      ip_address: ipAddress,
    })

    if (error) {
      console.error(
        '[audit] insert failed',
        redactSensitive(supabaseErrorFields(error)),
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[audit] exception', { message })
  }
}

/** Log a 403 / forbidden access attempt (API routes, uploads). */
export async function logUnauthorizedAccessAttempt(options: {
  actorId?: string | null
  actorType?: AuditActorType | null
  resource: string
  metadata?: Record<string, unknown>
  ipAddress?: string | null
}): Promise<void> {
  await logAuditEvent({
    actorId: options.actorId ?? null,
    actorType: options.actorType ?? null,
    action: 'unauthorized_access_attempt',
    targetType: 'resource',
    targetId: options.resource,
    metadata: {
      resource: options.resource,
      ...options.metadata,
    },
    ipAddress: options.ipAddress ?? null,
  })
}
