import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { withAuthCookieOptions } from '@/lib/supabase/cookies'

function applySessionCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, cookie)
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
  return response
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
  return response
}

export async function proxy(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (user) {
    if (path === '/admin/login') {
      return redirectWithPathname(request, supabaseResponse, '/admin', path)
    }
    if (path === '/login') {
      const redirectTo = request.nextUrl.searchParams.get('redirectTo')
      const destination =
        redirectTo?.startsWith('/portal') ? redirectTo : '/portal/application'
      return redirectWithPathname(request, supabaseResponse, destination, path)
    }
  }

  const isPublicPath =
    path === '/' ||
    path === '/manifest.json' ||
    path.endsWith('.json') ||
    path.startsWith('/courses') ||
    path.startsWith('/about') ||
    path.startsWith('/contact') ||
    path.startsWith('/apply') ||
    path.startsWith('/privacy') ||
    path.startsWith('/terms') ||
    path === '/login' ||
    path.startsWith('/admin/login') ||
    path.startsWith('/admin/accept-invite') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password') ||
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/icons/') ||
    path.startsWith('/sw.js') ||
    path.startsWith('/alumni/') ||
    path.startsWith('/members/') ||
    path.startsWith('/images/') ||
    path.startsWith('/favicon') ||
    path.startsWith('/splash')

  if (isPublicPath) {
    return nextWithPathname(request, supabaseResponse, path)
  }

  if (path.startsWith('/portal') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', path)
    const response = NextResponse.redirect(url)
    applySessionCookies(supabaseResponse, response)
    return response
  }

  if (
    path.startsWith('/admin') &&
    !path.startsWith('/admin/login') &&
    !path.startsWith('/admin/accept-invite') &&
    !user
  ) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url))
    applySessionCookies(supabaseResponse, response)
    return response
  }

  return nextWithPathname(request, supabaseResponse, path)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
