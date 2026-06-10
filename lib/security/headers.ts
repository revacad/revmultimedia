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

/** R2 hosts used in img-src (public bucket URL and presigned download endpoint). */
function r2ImgSources(): string[] {
  const sources: string[] = []
  const r2Public = hostFromEnvUrl(process.env.CLOUDFLARE_R2_PUBLIC_BUCKET_URL)
  if (r2Public) sources.push(`https://${r2Public}`)

  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim()
  if (accountId) {
    sources.push(`https://${accountId}.r2.cloudflarestorage.com`)
  }

  return sources
}

const PRODUCTION_APP_URLS = new Set([
  'https://revmultimedia.com',
  'https://www.revmultimedia.com',
  'https://revmultimediagh.com',
  'https://www.revmultimediagh.com',
])

function normalizeAppUrl(url: string): string {
  return url.trim().replace(/\/$/, '')
}

/** Vercel Live / feedback scripts on local and staging (not production domain). */
export function shouldAllowVercelLiveScripts(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const appUrl = normalizeAppUrl(
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '',
  )
  if (!appUrl) return false
  return !PRODUCTION_APP_URLS.has(appUrl)
}

/** Build Content-Security-Policy for the public app (adjust when adding third-party scripts). */
export function buildContentSecurityPolicy(isDev: boolean): string {
  const supabase = supabaseConnectSources()
  const siteHost = hostFromEnvUrl(
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  )
  const allowVercelLive = shouldAllowVercelLiveScripts()

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    'https://js.paystack.co',
    'https://www.googletagmanager.com',
    'https://us-assets.i.posthog.com',
    ...(isDev ? ["'unsafe-eval'"] : []),
    ...(allowVercelLive
      ? ['https://vercel.live', 'https://vercel-scripts.com']
      : []),
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
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://us.i.posthog.com',
    'https://us-assets.i.posthog.com',
    ...(siteHost ? [`https://${siteHost}`, `wss://${siteHost}`] : []),
    ...(isDev ? ['ws://localhost:3000', 'wss://localhost:3000'] : []),
    ...(allowVercelLive ? ['https://vercel.live', 'wss://vercel.live'] : []),
  ]

  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    'https://us-assets.i.posthog.com',
    ...r2ImgSources(),
  ]

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    `worker-src ${workerSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://api.fontshare.com https://cdn.fontshare.com https://fonts.googleapis.com https://paystack.com https://js.paystack.co",
    "font-src 'self' https://api.fontshare.com https://cdn.fontshare.com https://fonts.gstatic.com data:",
    `img-src ${imgSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://checkout.paystack.com https://standard.paystack.co https://paystack.com" +
      (allowVercelLive ? ' https://vercel.live' : ''),
    "media-src 'self'",
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
