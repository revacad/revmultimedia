export {
  logAuditEvent,
  logUnauthorizedAccessAttempt,
  type AuditAction,
  type AuditActorType,
  type LogAuditEventParams,
} from '@/lib/audit/log-event'

/** @deprecated Use LogAuditEventParams from log-event */
export type AuditLogParams = import('@/lib/audit/log-event').LogAuditEventParams

/** @deprecated Use LogAuditEventParams */
export type AuditLogEntry = import('@/lib/audit/log-event').LogAuditEventParams

/** @deprecated Use logAuditEvent from log-event */
export async function logAuditEventBackground(
  entry: import('@/lib/audit/log-event').LogAuditEventParams,
): Promise<void> {
  const { logAuditEvent: log } = await import('@/lib/audit/log-event')
  await log(entry)
}
