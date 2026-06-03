import { normalizeR2ObjectKey } from '@/lib/r2/keys'
import { generatePresignedDownloadUrl } from '@/lib/r2/presign'

/** 24 hours — course thumbnails and instructor photos are non-sensitive marketing assets. */
export const COURSE_MEDIA_PRESIGN_TTL_SECONDS = 86_400

function privateBucketName(): string | null {
  return (
    process.env.CLOUDFLARE_R2_BUCKET_NAME ?? process.env.R2_BUCKET_NAME ?? null
  )
}

/** R2 keys for course marketing images (private bucket). */
export function isCourseMediaR2Key(rawKey: string): boolean {
  const key = normalizeR2ObjectKey(rawKey)
  if (!key) return false
  return (
    key.startsWith('courses/thumbnails/') ||
    /^courses\/[0-9a-f-]{36}\/thumbnail\.[a-z0-9]+$/i.test(key) ||
    /^courses\/[0-9a-f-]{36}\/instructor-photo\//i.test(key)
  )
}

export async function presignCourseMediaKey(
  rawKey: string | null | undefined,
): Promise<string | null> {
  if (!rawKey) return null
  if (rawKey.startsWith('http://') || rawKey.startsWith('https://')) {
    return rawKey
  }

  const key = normalizeR2ObjectKey(rawKey)
  if (!key || !isCourseMediaR2Key(key)) return null

  const bucket = privateBucketName()
  if (!bucket) return null

  try {
    return await generatePresignedDownloadUrl(
      bucket,
      key,
      COURSE_MEDIA_PRESIGN_TTL_SECONDS,
    )
  } catch (error) {
    console.error('[r2] course media presign failed', {
      key,
      message: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
