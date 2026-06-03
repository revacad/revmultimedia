import { logServerError } from '@/lib/errors/log'

export type SuspiciousUploadLog = {
  route: string
  reason: string
  ip: string | null
  userId: string | null
  fileName?: string
  uploadKind?: string
  declaredMime?: string
  sniffedType?: string
}

export function logSuspiciousUpload(entry: SuspiciousUploadLog): void {
  logServerError('upload/suspicious', new Error(entry.reason), {
    route: entry.route,
    ip: entry.ip,
    userId: entry.userId,
    fileName: entry.fileName,
    uploadKind: entry.uploadKind,
    declaredMime: entry.declaredMime,
    sniffedType: entry.sniffedType,
  })
}
