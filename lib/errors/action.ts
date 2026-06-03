import { logServerError } from '@/lib/errors/log'

export function safeActionError(
  context: string,
  error: unknown,
  userMessage = 'Something went wrong. Please try again.',
): { error: string } {
  logServerError(context, error)
  return { error: userMessage }
}

export function safeActionFailure(
  context: string,
  error: unknown,
  userMessage = 'Something went wrong. Please try again.',
): { success: false; error: string } {
  logServerError(context, error)
  return { success: false, error: userMessage }
}
