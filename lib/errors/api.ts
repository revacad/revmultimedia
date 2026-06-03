import { NextResponse } from 'next/server'
import { logServerError } from '@/lib/errors/log'
import { isNetworkError } from '@/lib/errors/network'
import { applyCorsHeaders, corsPreflightResponse } from '@/lib/security/cors'

const GENERIC_ERROR = 'Something went wrong. Please try again.'
const NETWORK_ERROR = 'Service temporarily unavailable. Please try again.'

export function apiErrorResponse(route: string, error: unknown, status = 500): NextResponse {
  logServerError(route, error)

  if (isNetworkError(error)) {
    return NextResponse.json({ error: NETWORK_ERROR }, { status: 503 })
  }

  return NextResponse.json({ error: GENERIC_ERROR }, { status })
}

export function authErrorResponse(route: string, authError: unknown): NextResponse {
  if (authError) {
    logServerError(`${route}:auth`, authError)
  }

  if (isNetworkError(authError)) {
    return NextResponse.json({ error: NETWORK_ERROR }, { status: 503 })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

type ApiHandler = (request: Request, context?: unknown) => Promise<Response> | Response

/** Catch-all wrapper for API route handlers — logs server-side, returns generic JSON on throw. */
export function withApiHandler(route: string, handler: ApiHandler): ApiHandler {
  return async (request: Request, context?: unknown) => {
    const preflight = corsPreflightResponse(request)
    if (preflight) return preflight

    try {
      const response = await handler(request, context)
      if (response instanceof NextResponse) {
        return applyCorsHeaders(request, response)
      }
      return response
    } catch (error) {
      return applyCorsHeaders(request, apiErrorResponse(route, error))
    }
  }
}
