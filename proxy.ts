import type { User } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isLegacyMarketingPath } from '@/lib/legacy-paths'
import { mergeAuthCookieOptions } from '@/lib/supabase/cookies'
import { withAuthCookieOptions } from '@/lib/supabase/cookies'
import { corsPreflightResponse } from '@/lib/security/cors'
import { applySecurityHeaders } from '@/lib/security/headers'
import { isSessionBindingValid, clearSessionBinding } from '@/lib/auth/session-binding'
import { getRequestMetaFromHeaders } from '@/lib/auth/request-meta'
import { hasActiveAdminProfile } from '@/lib/auth/active-admin'
import { sanitizeRedirectPath } from '@/lib/security/paths'
import {
  getMaintenanceSettings,
  shouldRedirectToMaintenance,
} from '@/lib/maintenance/settings'

function isAdminAuthPath(path: string): boolean {
  return (
    path.startsWith('/admin/login') ||
    path.startsWith('/admin/accept-invite') ||
    path === '/admin/forgot-password' ||
    path.startsWith('/admin/reset-password')
  )
}

function isProtectedAdminPath(path: string): boolean {
  return path.startsWith('/admin') && !isAdminAuthPath(path)
}

function applySessionCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie) => {
    const { name, value, path, domain, maxAge, expires, httpOnly, secure, sameSite } =
      cookie
    to.cookies.set(
      name,
      value,
      mergeAuthCookieOptions({
        path,
        domain,
        maxAge,
        expires: expires instanceof Date ? expires : undefined,
        httpOnly,
        secure,
        sameSite,
      }),
    )
  })
}

function nextWithPathname(
  request: NextRequest,
  supabaseResponse: NextResponse,
  path: string,
): NextResponse {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', path)
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  applySessionCookies(supabaseResponse, response)
  return applySecurityHeaders(response)
}

function redirectWithPathname(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
  pathForHeader: string,
): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  const response = NextResponse.redirect(url)
  applySessionCookies(supabaseResponse, response)
  response.headers.set('x-pathname', pathForHeader)
  return applySecurityHeaders(response)
}

/** Public routes that bypass Supabase session refresh and auth redirects. */
function isPublicRoute(path: string): boolean {
  if (path === '/manifest.json' || path === '/favicon.ico') return true
  if (path.startsWith('/_next/')) return true
  if (path.startsWith('/images/')) return true
  if (path.startsWith('/fonts/')) return true
  if (path.startsWith('/alumni/')) return true
  if (path.startsWith('/api/otp/')) return true
  if (path === '/api/paystack/webhook' || path === '/api/fishafrica/webhook') {
    return true
  }
  if (path.startsWith('/apply')) return true
  if (
    path === '/api/schools/search' ||
    path === '/api/r2/presign' ||
    path === '/api/r2/upload' ||
    path === '/api/r2/confirm'
  ) {
    return true
  }
  return (
    path === '/' ||
    path.endsWith('.json') ||
    path.startsWith('/courses') ||
    path.startsWith('/about') ||
    path.startsWith('/contact') ||
    path.startsWith('/privacy') ||
    path.startsWith('/terms') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password') ||
    path.startsWith('/icons/') ||
    path.startsWith('/favicon') ||
    path.startsWith('/splash') ||
    path.startsWith('/members/')
  )
}

function nextWithoutSession(request: NextRequest, path: string): NextResponse {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', path)
  return applySecurityHeaders(
    NextResponse.next({
      request: { headers: requestHeaders },
    }),
  )
}

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => {
    const name = cookie.name.toLowerCase()
    return name.includes('auth-token') || name.startsWith('sb-')
  })
}

function isStaleRefreshAuthError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; status?: number }
  return (
    e.code === 'refresh_token_not_found' ||
    e.code === 'invalid_refresh_token' ||
    e.status === 400
  )
}

async function clearStaleAuthSession(
  supabase: ReturnType<typeof createServerClient>,
): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // Stale cookie cleanup only — ignore signOut failures.
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto')
    if (proto === 'http') {
      const url = request.nextUrl.clone()
      url.protocol = 'https:'
      return applySecurityHeaders(NextResponse.redirect(url, 308))
    }
  }

  if (path.startsWith('/api/')) {
    const preflight = corsPreflightResponse(request)
    if (preflight) return applySecurityHeaders(preflight)
  }

  try {
    const maintenance = await getMaintenanceSettings()
    if (shouldRedirectToMaintenance(path, maintenance)) {
      const url = request.nextUrl.clone()
      url.pathname = '/maintenance'
      url.search = ''
      return applySecurityHeaders(NextResponse.redirect(url))
    }
  } catch (err) {
    console.error('[proxy] maintenance check failed:', err)
  }

  if (isLegacyMarketingPath(path)) {
    return applySecurityHeaders(new NextResponse(null, { status: 404 }))
  }

  if (isPublicRoute(path)) {
    return nextWithoutSession(request, path)
  }

  // Portal auth is enforced in server components. Skipping Supabase network refresh here
  // avoids cookie churn and redirect loops with /login in development.
  if (path.startsWith('/portal')) {
    if (!hasSupabaseSessionCookie(request)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', path)
      return applySecurityHeaders(NextResponse.redirect(url))
    }
    return nextWithoutSession(request, path)
  }

  // Next.js App Router makes frequent internal RSC/prefetch requests (often with ?_rsc=...).
  // Avoid blocking those on a network roundtrip to Supabase in middleware; the server components
  // (layouts/pages) still enforce auth and will redirect if needed.
  const isInternalRscRequest =
    request.nextUrl.searchParams.has('_rsc') ||
    request.headers.get('rsc') === '1' ||
    request.headers.get('RSC') === '1' ||
    request.headers.has('next-router-prefetch') ||
    request.headers.has('Next-Router-Prefetch') ||
    request.headers.has('next-router-state-tree') ||
    request.headers.has('Next-Router-State-Tree') ||
    request.headers.get('accept')?.includes('text/x-component') === true

  if (isInternalRscRequest) {
    return nextWithoutSession(request, path)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          withAuthCookieOptions(cookiesToSet).forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  let user: User | null = null

  try {
    const result = await supabase.auth.getUser()
    if (result.error && isStaleRefreshAuthError(result.error)) {
      await clearStaleAuthSession(supabase)
      user = null
    } else {
      user = result.data.user
    }
  } catch (err) {
    if (isStaleRefreshAuthError(err)) {
      await clearStaleAuthSession(supabase)
      user = null
    } else {
      console.error('[proxy] supabase.auth.getUser failed:', err)
      // Network timeout — allow request through; page layout will re-check auth.
      return nextWithPathname(request, supabaseResponse, path)
    }
  }

  const protectedSessionPath =
    path.startsWith('/portal') || isProtectedAdminPath(path)

  const enforceSessionBinding =
    process.env.NODE_ENV === 'production' &&
    process.env.DISABLE_SESSION_BINDING !== 'true'

  if (user && protectedSessionPath && enforceSessionBinding) {
    const { ip, userAgent } = getRequestMetaFromHeaders(request.headers)
    const bindingOk = await isSessionBindingValid(user.id, ip, userAgent)
    if (!bindingOk) {
      await supabase.auth.signOut({ scope: 'global' })
      await clearSessionBinding(user.id)
      const loginPath = path.startsWith('/admin') ? '/admin/login' : '/login'
      const url = request.nextUrl.clone()
      url.pathname = loginPath
      url.search = 'reason=session'
      const response = NextResponse.redirect(url)
      applySessionCookies(supabaseResponse, response)
      return applySecurityHeaders(response)
    }
  }

  if (user && isProtectedAdminPath(path)) {
    const isAdmin = await hasActiveAdminProfile(user.id)
    if (!isAdmin) {
      await supabase.auth.signOut({ scope: 'local' })
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.search = 'reason=not_admin'
      const response = NextResponse.redirect(url)
      applySessionCookies(supabaseResponse, response)
      return applySecurityHeaders(response)
    }
  }

  if (user) {
    if (path === '/admin/login') {
      const reason = request.nextUrl.searchParams.get('reason')
      const signedOut = request.nextUrl.searchParams.get('signed_out')
      if (reason === 'session' || reason === 'not_admin') {
        await supabase.auth.signOut({ scope: 'local' })
        return nextWithPathname(request, supabaseResponse, path)
      }
      if (!signedOut && (await hasActiveAdminProfile(user.id))) {
        return redirectWithPathname(request, supabaseResponse, '/admin', path)
      }
      return nextWithPathname(request, supabaseResponse, path)
    }
    if (path === '/login') {
      const redirectTo = request.nextUrl.searchParams.get('redirectTo')
      if (!redirectTo) {
        return nextWithPathname(request, supabaseResponse, path)
      }
      const destination = sanitizeRedirectPath(redirectTo)
      return redirectWithPathname(request, supabaseResponse, destination, path)
    }
  }

  const isPublicPath =
    path === '/login' ||
    path.startsWith('/admin/login') ||
    path.startsWith('/admin/accept-invite') ||
    path === '/admin/forgot-password' ||
    path.startsWith('/admin/reset-password') ||
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/sw.js') ||
    path.startsWith('/monitoring')

  if (isPublicPath) {
    return nextWithPathname(request, supabaseResponse, path)
  }

  if (isProtectedAdminPath(path) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    const response = NextResponse.redirect(url)
    response.headers.set('x-pathname', '/admin/login')
    applySessionCookies(supabaseResponse, response)
    return applySecurityHeaders(response)
  }

  return nextWithPathname(request, supabaseResponse, path)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}
