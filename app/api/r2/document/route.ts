import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse, type NextRequest } from 'next/server'
import { authErrorResponse, apiErrorResponse } from '@/lib/errors/api'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { userCanAccessR2Object } from '@/lib/r2/document-access'
import { parseR2KeyQueryParam } from '@/lib/r2/keys'
import { logUnauthorizedAccessAttempt } from '@/lib/audit/log'
import { getClientIp } from '@/lib/auth/getClientIp'
import { s3Client } from '@/lib/r2/client'

const DOCUMENT_URL_TTL_SECONDS = 15 * 60

export async function GET(request: NextRequest) {
  try {
    const key = parseR2KeyQueryParam(request.nextUrl.searchParams.get('key'))
    if (!key) {
      return NextResponse.json({ error: 'Invalid document key' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return authErrorResponse('r2/document', authError)
    }

    const admin = createAdminClient()
    const allowed = await userCanAccessR2Object(admin, user.id, key)
    if (!allowed) {
      const ip = await getClientIp()
      void logUnauthorizedAccessAttempt({
        actorId: user.id,
        resource: `r2/document:${key}`,
        ipAddress: ip,
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
    if (!bucket) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 503 })
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: 'attachment',
    })

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: DOCUMENT_URL_TTL_SECONDS,
    })

    return NextResponse.redirect(signedUrl, 302)
  } catch (error) {
    return apiErrorResponse('r2/document', error)
  }
}
