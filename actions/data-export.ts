'use server'

import { logAuditEvent } from '@/lib/audit/log'
import { getClientIp } from '@/lib/auth/getClientIp'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import { buildStudentDataExport } from '@/lib/compliance/export-student-data'
import { checkRateLimit, dataExportLimit } from '@/lib/redis/ratelimit'
import { safeActionError } from '@/lib/errors/action'

export type ExportMyDataResult =
  | {
      success: true
      json: string
      filename: string
      contentType: string
    }
  | { success: false; error: string }

function exportFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `my-rev-data-${date}.json`
}

export async function exportMyData(): Promise<ExportMyDataResult> {
  try {
    const user = await requirePortalUser()

    const { allowed } = await checkRateLimit(dataExportLimit, user.id)
    if (!allowed) {
      return {
        success: false,
        error: 'You can export your data once per hour. Please try again later.',
      }
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

    return {
      success: true,
      json,
      filename,
      contentType: 'application/json',
    }
  } catch (error) {
    const result = safeActionError('exportMyData', error)
    return { success: false, error: result.error }
  }
}
