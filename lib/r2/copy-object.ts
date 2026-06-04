import { CopyObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '@/lib/r2/client'

function bucketName(): string {
  const bucket =
    process.env.CLOUDFLARE_R2_BUCKET_NAME ?? process.env.R2_BUCKET_NAME
  if (!bucket) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME is not configured')
  }
  return bucket
}

export async function copyR2Object(sourceKey: string, destKey: string): Promise<void> {
  const source = sourceKey.trim()
  const dest = destKey.trim()
  if (!source || !dest || source === dest) return

  const bucket = bucketName()
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${encodeURIComponent(source).replace(/%2F/g, '/')}`,
      Key: dest,
    }),
  )
}

/** Move instructor photo from draft course folder to persisted course id. */
export async function finalizeCourseInstructorPhotoKey(
  photoKey: string | null,
  draftCourseId: string,
  courseId: string,
): Promise<string | null> {
  if (!photoKey?.trim()) return null

  const prefix = `courses/${draftCourseId}/`
  if (!photoKey.includes(prefix)) return photoKey

  const destKey = photoKey.replace(prefix, `courses/${courseId}/`)
  await copyR2Object(photoKey, destKey)

  const { deleteR2Object } = await import('@/lib/r2/delete-objects')
  await deleteR2Object(photoKey)

  return destKey
}
