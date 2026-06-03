import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { redis } from '@/lib/redis/client'
import { publicSearchLimit } from '@/lib/redis/ratelimit'
import { getRequestIp, rateLimitOrNull } from '@/lib/security/rate-limit-request'
import { apiErrorResponse } from '@/lib/errors/api'
import { applyCorsHeaders } from '@/lib/security/cors'
import { toCourseSearchResult } from '@/lib/api/responses'
import { searchQuerySchema } from '@/lib/validations/api'

export async function GET(request: NextRequest) {
  try {
  const limited = await rateLimitOrNull(publicSearchLimit, [getRequestIp(request)], 60)
  if (limited) return applyCorsHeaders(request, limited)

  const rawQ = request.nextUrl.searchParams.get('q') ?? ''
  const parsed = searchQuerySchema.safeParse({ q: rawQ })
  if (!parsed.success) {
    return applyCorsHeaders(request, NextResponse.json({ results: [] }))
  }
  const query = parsed.data.q

  const cacheKey = `search:courses:${query.toLowerCase()}`
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return applyCorsHeaders(request, NextResponse.json({ results: cached, cached: true }))
    }
  } catch {
    // Continue without cache
  }

  const supabase = await createServerClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('title, slug, category, mode, tuition_fee_ghs')
    .eq('is_published', true)
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english',
    })
    .limit(6)

  const results = (courses ?? []).map(toCourseSearchResult)

  try {
    await redis.set(cacheKey, results, { ex: 60 })
  } catch {
    // Non-fatal
  }

  return applyCorsHeaders(request, NextResponse.json({ results }))
  } catch (error) {
    return applyCorsHeaders(request, apiErrorResponse('search/courses', error))
  }
}
