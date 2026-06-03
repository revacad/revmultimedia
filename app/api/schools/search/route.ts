import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/errors/api'
import { toSchoolSearchResult } from '@/lib/api/responses'
import { searchSeniorHighSchools } from '@/lib/schools/search'
import { publicSearchLimit } from '@/lib/redis/ratelimit'
import { getRequestIp, rateLimitOrNull } from '@/lib/security/rate-limit-request'
import { applyCorsHeaders } from '@/lib/security/cors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const limited = await rateLimitOrNull(publicSearchLimit, [getRequestIp(request)], 60)
  if (limited) return applyCorsHeaders(request, limited)

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  if (q.length < 2) {
    return applyCorsHeaders(request, NextResponse.json({ schools: [] }))
  }

  try {
    const schools = (await searchSeniorHighSchools(q, 15)).map(toSchoolSearchResult)
    return applyCorsHeaders(
      request,
      NextResponse.json(
        { schools },
        {
          headers: {
            'Cache-Control': 'private, max-age=60',
          },
        },
      ),
    )
  } catch (error) {
    return applyCorsHeaders(request, apiErrorResponse('schools/search', error))
  }
}
