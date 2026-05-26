import type { NextResponse } from 'next/server'

function hostFromEnvUrl(envValue: string | undefined): string | null {
  if (!envValue?.trim()) return null
  try {
    return new URL(envValue.trim()).host
  } catch {
    return null
  }
}

function supabaseConnectSources(): string[] {
  const host = hostFromEnvUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  if (!host) return []
  return [`https://${host}`, `wss://${host}`]
}

/** Presigned PUT/GET from the browser to R2 (bucket.accountId.r2.cloudflarestorage.com). */
function r2ConnectSources(): string[] {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim()
  if (!accountId) return []
  return [`https://*.${accountId}.r2.cloudflarestorage.com`]
}

/** Build Content-Security-Policy for the public app (adjust when adding third-party scripts). */
export function buildContentSecurityPolicy(isDev: boolean): string {
  const supabase = supabaseConnectSources()
  const r2Public = hostFromEnvUrl(process.env.CLOUDFLARE_R2_PUBLIC_BUCKET_URL)
  const siteHost = hostFromEnvUrl(
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  )

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    'https://js.paystack.co',
    ...(isDev ? ["'unsafe-eval'"] : []),
  ]

  const workerSrc = ["'self'", 'blob:']

  const connectSrc = [
    "'self'",
    ...supabase,
    ...r2ConnectSources(),
    'https://api.upstash.io',
    'https://*.ingest.us.sentry.io',
    'https://*.ingest.sentry.io',
    'https://api.paystack.co',
    'https://standard.paystack.co',
    ...(siteHost ? [`https://${siteHost}`, `wss://${siteHost}`] : []),
    ...(isDev ? ['ws://localhost:3000', 'wss://localhost:3000'] : []),
  ]

  const imgSrc = ["'self'", 'data:', 'blob:', 'https:']
  if (r2Public) imgSrc.push(`https://${r2Public}`)

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    `worker-src ${workerSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://api.fontshare.com https://cdn.fontshare.com https://fonts.googleapis.com",
    "font-src 'self' https://api.fontshare.com https://cdn.fontshare.com https://fonts.gstatic.com data:",
    `img-src ${imgSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://checkout.paystack.com",
    "media-src 'self' https: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ]

  return directives.join('; ')
}

export function getSecurityHeaders(): Record<string, string> {
  const isDev = process.env.NODE_ENV !== 'production'

  return {
    'Content-Security-Policy': buildContentSecurityPolicy(isDev),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-DNS-Prefetch-Control': 'on',
    ...(isDev
      ? {}
      : {
          'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        }),
  }
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders()
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}
