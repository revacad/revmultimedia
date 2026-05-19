'use server'

import { generatePresignedDownloadUrl } from '@/lib/r2/presign'

export async function getDocumentUrl(r2Key: string): Promise<string> {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  if (!bucket) {
    throw new Error('R2 bucket is not configured')
  }

  return generatePresignedDownloadUrl(bucket, r2Key, 900)
}
