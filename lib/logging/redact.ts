const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'card',
  'cvv',
  'pan',
]

export function redactSensitive(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitive(item))
  }
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s))
        ? '[REDACTED]'
        : redactSensitive(v),
    ]),
  )
}

/** Safe fields from Supabase/PostgREST errors for logging. */
export function supabaseErrorFields(
  error: { message?: string; code?: string; details?: string; hint?: string } | null | undefined,
): Record<string, string | undefined> {
  if (!error) return {}
  return {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  }
}
