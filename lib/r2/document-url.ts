import { normalizeR2ObjectKey } from '@/lib/r2/keys'

export function r2DocumentHref(key: string): string {
  return `/api/r2/document?key=${encodeURIComponent(normalizeR2ObjectKey(key))}`
}

export function isR2DocumentSrc(src: string): boolean {
  return src.startsWith('/api/r2/document')
}

export function r2DocumentAbsoluteUrl(key: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
  return `${base}${r2DocumentHref(key)}`
}
