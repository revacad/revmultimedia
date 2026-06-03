import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildStudentDataExport } from '@/lib/compliance/export-student-data'
import { checkRateLimit, dataExportLimit } from '@/lib/redis/ratelimit'
import { logAuditEvent } from '@/lib/audit/log'
import { getClientIp } from '@/lib/auth/getClientIp'
import { apiErrorResponse } from '@/lib/errors/api'
import { applyCorsHeaders } from '@/lib/security/cors'

function exportFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `my-rev-data-${date}.json`
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return applyCorsHeaders(
        request,
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      )
    }

    const { allowed } = await checkRateLimit(dataExportLimit, user.id)
    if (!allowed) {
      return applyCorsHeaders(
        request,
        NextResponse.json(
          {
            error:
              'You can export your data once per hour. Please try again later.',
          },
          { status: 429 },
        ),
      )
    }

    const payload = await buildStudentDataExport(user.id)
    const json = JSON.stringify(payload, null, 2)
    const filename = exportFilename()
    const ip = await getClientIp()

    void logAuditEvent({
      actorId: user.id,
      actorType: 'student',
      action: 'data_exported',
      targetType: 'user',
      targetId: user.id,
      metadata: { filename },
      ipAddress: ip,
    })

    return applyCorsHeaders(
      request,
      new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      }),
    )
  } catch (error) {
    return applyCorsHeaders(request, apiErrorResponse('portal/export-my-data', error))
  }
}
