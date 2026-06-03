import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { s3Client } from '@/lib/r2/client'

function bucketName(): string {
  const bucket =
    process.env.CLOUDFLARE_R2_BUCKET_NAME ?? process.env.R2_BUCKET_NAME
  if (!bucket) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME is not configured')
  }
  return bucket
}

export async function deleteR2Object(key: string): Promise<void> {
  const normalized = key.trim()
  if (!normalized) return

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName(),
        Key: normalized,
      }),
    )
  } catch (error) {
    console.error('[r2] delete object failed', { key: normalized, message: String(error) })
  }
}

export async function deleteR2Objects(keys: string[]): Promise<void> {
  const unique = [...new Set(keys.map((k) => k.trim()).filter(Boolean))]
  if (unique.length === 0) return

  const bucket = bucketName()
  const batchSize = 1000

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize)
    try {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: batch.map((Key) => ({ Key })) },
        }),
      )
    } catch (error) {
      console.error('[r2] batch delete failed', { count: batch.length, message: String(error) })
    }
  }
}

/** Deletes all objects under a prefix (e.g. documents/REV000123/). */
export async function deleteR2Prefix(prefix: string): Promise<void> {
  const normalized = prefix.trim().replace(/^\/+/, '')
  if (!normalized) return

  const bucket = bucketName()
  let continuationToken: string | undefined

  do {
    const list = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: normalized.endsWith('/') ? normalized : `${normalized}/`,
        ContinuationToken: continuationToken,
      }),
    )

    const keys = (list.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => Boolean(k))

    if (keys.length > 0) {
      await deleteR2Objects(keys)
    }

    continuationToken = list.IsTruncated
      ? list.NextContinuationToken
      : undefined
  } while (continuationToken)
}
