import { NextResponse } from 'next/server'

function normalizeOrigin(url: string): string | null {
  try {
    return new URL(url.trim()).origin
  } catch {
    return null
  }
}

function allowedOrigins(): Set<string> {
  const origins = new Set<string>()
  for (const raw of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://revmultimedia.com',
    'https://www.revmultimedia.com',
    'https://revmultimediagh.com',
    'https://www.revmultimediagh.com',
  ]) {
    const o = raw ? normalizeOrigin(raw) : null
    if (o) origins.add(o)
  }
  const extra = process.env.CORS_ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) ?? []
  for (const raw of extra) {
    const o = normalizeOrigin(raw)
    if (o) origins.add(o)
  }
  return origins
}

export function resolveCorsOrigin(request: Request): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null
  return allowedOrigins().has(origin) ? origin : null
}

/** Reject cross-origin preflight from unknown origins. */
export function corsPreflightResponse(request: Request): NextResponse | null {
  if (request.method !== 'OPTIONS') return null

  const allowed = resolveCorsOrigin(request)
  if (!allowed) {
    return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Requested-With, upstash-signature',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  })
}

export function applyCorsHeaders(
  request: Request,
  response: NextResponse,
): NextResponse {
  const allowed = resolveCorsOrigin(request)
  if (allowed) {
    response.headers.set('Access-Control-Allow-Origin', allowed)
    response.headers.append('Vary', 'Origin')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return response
}
