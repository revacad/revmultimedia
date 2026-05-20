import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { withAuthCookieOptions } from '@/lib/supabase/cookies'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
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

  const publicPaths = [
    '/login',
    '/admin/login',
    '/admin/accept-invite',
    '/forgot-password',
    '/reset-password',
    '/splash',
    '/api/',
    '/_next/',
    '/favicon',
    '/manifest.json',
    '/sw.js',
    '/workbox-',
    '/icons/',
  ]

  const isPublicPath = publicPaths.some((p) => path.startsWith(p))

  if (!isPublicPath && path.startsWith('/portal')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  if (
    path.startsWith('/admin') &&
    !path.startsWith('/admin/login') &&
    !path.startsWith('/admin/accept-invite')
  ) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  supabaseResponse.headers.set('x-pathname', path)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
