import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { redis } from '@/lib/redis/client'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const cacheKey = `search:courses:${query.toLowerCase()}`
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return NextResponse.json({ results: cached, cached: true })
    }
  } catch {
    // Continue without cache
  }

  const supabase = await createServerClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, category, mode, tuition_fee_ghs')
    .eq('is_published', true)
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english',
    })
    .limit(6)

  const results = courses ?? []

  try {
    await redis.set(cacheKey, results, { ex: 60 })
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ results })
}
