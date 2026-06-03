import { redactSensitive, supabaseErrorFields } from '@/lib/logging/redact'

/** Server-side error logging. Never return this output to clients. */
export function logServerError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  const safeExtra = extra ? (redactSensitive(extra) as Record<string, unknown>) : undefined

  if (error instanceof Error) {
    console.error(`[${context}]`, redactSensitive({
      name: error.name,
      message: error.message,
      ...safeExtra,
    }))
    return
  }

  if (error && typeof error === 'object' && 'message' in error) {
    console.error(`[${context}]`, redactSensitive({
      ...supabaseErrorFields(error as { message?: string; code?: string }),
      ...safeExtra,
    }))
    return
  }

  console.error(`[${context}]`, redactSensitive({ detail: String(error), ...safeExtra }))
}
