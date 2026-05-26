import { checkRateLimit, formBurstLimit } from '@/lib/redis/ratelimit'

const SCRIPT_PATTERN = /<script|javascript:|on\w+\s*=/i
const SQL_PATTERN =
  /\b(union\s+select|drop\s+table|insert\s+into|delete\s+from|exec\s*\(|;\s*--|'\s*or\s+'1'\s*=\s*'1)\b/i
const MAX_FIELD_LENGTH = 20_000

export type PublicFormId = 'apply' | 'contact'

export function logAbuseAttempt(info: {
  form: PublicFormId
  ip: string
  reason: string
  email?: string
}): void {
  console.warn('[abuse-blocked]', {
    ...info,
    at: new Date().toISOString(),
  })
}

export function detectAttackPattern(value: string): string | null {
  if (value.length > MAX_FIELD_LENGTH) return 'oversized_input'
  if (SCRIPT_PATTERN.test(value)) return 'script_pattern'
  if (SQL_PATTERN.test(value)) return 'sql_pattern'
  return null
}

export function scanFieldValues(values: string[]): string | null {
  for (const value of values) {
    const hit = detectAttackPattern(value)
    if (hit) return hit
  }
  return null
}

const GENERIC_ERROR = 'Unable to submit right now. Please try again later.'

export async function guardFormSubmission(input: {
  form: PublicFormId
  ip: string
  email?: string
  honeypot?: string
  fieldValues: string[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.honeypot?.trim()) {
    logAbuseAttempt({
      form: input.form,
      ip: input.ip,
      reason: 'honeypot',
      email: input.email,
    })
    return { ok: false, error: GENERIC_ERROR }
  }

  const attack = scanFieldValues(input.fieldValues)
  if (attack) {
    logAbuseAttempt({
      form: input.form,
      ip: input.ip,
      reason: attack,
      email: input.email,
    })
    return { ok: false, error: GENERIC_ERROR }
  }

  const burstKeys = [
    `form:${input.form}:ip:${input.ip}`,
    input.email ? `form:${input.form}:email:${input.email}` : null,
  ].filter((k): k is string => Boolean(k))

  for (const key of burstKeys) {
    const { allowed } = await checkRateLimit(formBurstLimit, key)
    if (!allowed) {
      logAbuseAttempt({
        form: input.form,
        ip: input.ip,
        reason: 'burst_limit',
        email: input.email,
      })
      return { ok: false, error: GENERIC_ERROR }
    }
  }

  return { ok: true }
}
