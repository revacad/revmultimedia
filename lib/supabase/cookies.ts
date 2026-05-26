type CookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: boolean | 'lax' | 'strict' | 'none'
  secure?: boolean
}

type CookieToSet = {
  name: string
  value: string
  options?: CookieOptions
}

function shouldUseSecureCookies(): boolean {
  if (process.env.NODE_ENV === 'production') return true
  if (process.env.VERCEL === '1') return true
  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL
  return typeof url === 'string' && url.startsWith('https')
}

/** Production apex/www on revmultimedia.com — use leading dot so cookies work on both. */
export function getAuthCookieDomain(): string | undefined {
  const explicit = process.env.SUPABASE_COOKIE_DOMAIN?.trim()
  if (explicit) return explicit

  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]

  for (const raw of candidates) {
    if (!raw) continue
    try {
      const hostname = new URL(
        raw.startsWith('http') ? raw : `https://${raw}`,
      ).hostname
      if (
        hostname === 'revmultimedia.com' ||
        hostname.endsWith('.revmultimedia.com')
      ) {
        return '.revmultimedia.com'
      }
    } catch {
      // ignore invalid URL
    }
  }

  return undefined
}

export function mergeAuthCookieOptions(options?: CookieOptions): CookieOptions {
  const domain = getAuthCookieDomain()
  return {
    ...options,
    path: options?.path ?? '/',
    httpOnly: options?.httpOnly ?? true,
    sameSite: options?.sameSite ?? 'lax',
    secure: options?.secure ?? shouldUseSecureCookies(),
    ...(domain && options?.domain === undefined ? { domain } : {}),
  }
}

export function withAuthCookieOptions(cookiesToSet: CookieToSet[]): CookieToSet[] {
  return cookiesToSet.map(({ name, value, options }) => ({
    name,
    value,
    options: mergeAuthCookieOptions(options),
  }))
}
