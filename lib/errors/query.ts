import { defaultLoadErrorMessage } from '@/lib/errors/network'
import { logServerError } from '@/lib/errors/log'

/** Logs the Supabase error server-side and returns a safe user-facing message. */
export function supabaseErrorMessage(error: unknown, context = 'supabase'): string {
  logServerError(context, error)
  return defaultLoadErrorMessage()
}
