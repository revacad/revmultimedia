const DEFAULT_FROM_EMAIL = 'noreply@revmultimedia.com'
const DEFAULT_NOTIFY_EMAIL = 'notify@revmultimedia.com'

export function getDefaultFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL
}

/** From address for admin-to-student direct messages and notifications. */
export function getNotifyFromEmail(): string {
  return process.env.RESEND_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY_EMAIL
}

export function resolveResendFrom(fromOverride?: string | null): string {
  const override = fromOverride?.trim()
  if (override) return override
  return getDefaultFromEmail()
}
