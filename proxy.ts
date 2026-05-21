import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { withAuthCookieOptions } from '@/lib/supabase/cookies'

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

  const isPublicPath =
    path === '/' ||
    path.startsWith('/courses') ||
    path.startsWith('/about') ||
    path.startsWith('/contact') ||
    path.startsWith('/apply') ||
    path.startsWith('/privacy') ||
    path.startsWith('/terms') ||
    path.startsWith('/login') ||
    path.startsWith('/admin/login') ||
    path.startsWith('/admin/accept-invite') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password') ||
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/icons/') ||
    path.startsWith('/alumni/') ||
    path.startsWith('/members/') ||
    path.startsWith('/images/') ||
    path.startsWith('/manifest.json') ||
    path.startsWith('/favicon') ||
    path.startsWith('/splash')

  if (isPublicPath) {
    return supabaseResponse
  }

  if (path.startsWith('/portal') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', path)
    return NextResponse.redirect(url)
  }

  if (
    path.startsWith('/admin') &&
    !path.startsWith('/admin/login') &&
    !path.startsWith('/admin/accept-invite') &&
    !user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
