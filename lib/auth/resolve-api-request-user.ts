import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

function bearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length).trim()
  return token || null
}

export function getSupabaseAuthCookieName(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/)
  const projectRef = match?.[1] ?? 'project'
  return `sb-${projectRef}-auth-token`
}

export async function resolveApiRequestUser(request: Request): Promise<{
  user: User | null
  authError: Error | null
}> {
  const token = bearerToken(request)
  if (token) {
    const admin = createAdminClient()
    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token)
    if (error || !user) {
      return { user: null, authError: error ?? new Error('Unauthorized') }
    }
    return { user, authError: null }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  return { user: user ?? null, authError: error ?? null }
}
