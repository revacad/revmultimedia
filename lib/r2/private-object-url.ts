import { generatePresignedDownloadUrl } from '@/lib/r2/presign'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'

const DEFAULT_TTL_SECONDS = 3600

export async function getPrivateR2PresignedUrl(
  r2Key: string | null | undefined,
  expiresInSeconds = DEFAULT_TTL_SECONDS,
): Promise<string | null> {
  if (!r2Key?.trim()) return null

  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  if (!bucket) return null

  try {
    return await generatePresignedDownloadUrl(
      bucket,
      normalizeR2ObjectKey(r2Key),
      expiresInSeconds,
    )
  } catch {
    return null
  }
}
