'use server'

import { requireSuperAdmin } from '@/lib/auth/requireAdmin'

export async function triggerDatabaseExport(): Promise<
  | { success: true; key: string; counts: Record<string, number>; exportedAt: string }
  | { error: string }
> {
  await requireSuperAdmin()

  const secret = process.env.EXPORT_SECRET_KEY
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000'

  if (!secret) {
    return { error: 'EXPORT_SECRET_KEY is not configured' }
  }

  try {
    const res = await fetch(`${baseUrl}/api/export`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    })

    const data = (await res.json()) as {
      success?: boolean
      key?: string
      counts?: Record<string, number>
      exportedAt?: string
      error?: string
    }

    if (!res.ok) {
      return { error: data.error ?? 'Export failed' }
    }

    return {
      success: true,
      key: data.key ?? '',
      counts: data.counts ?? {},
      exportedAt: data.exportedAt ?? new Date().toISOString(),
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Export failed' }
  }
}
