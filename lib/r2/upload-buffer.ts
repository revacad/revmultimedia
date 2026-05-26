import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '@/lib/r2/client'

export async function uploadBufferToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  if (!bucket) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME is not configured')
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}
