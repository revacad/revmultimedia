import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.DISABLE_OTP_VERIFICATION === 'true'
  ) {
    console.error(
      '[CRITICAL] DISABLE_OTP_VERIFICATION is true in production. This is a security risk.',
    )
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
