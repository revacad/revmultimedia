import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/r2/client";

export async function generatePresignedUploadUrl(
  bucket: string,
  key: string,
  expiresInSeconds: number,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function generatePresignedDownloadUrl(
  bucket: string,
  key: string,
  expiresInSeconds: number,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export function getPublicUrl(key: string): string {
  const base = process.env.CLOUDFLARE_R2_PUBLIC_BUCKET_URL!.replace(/\/$/, "");
  return `${base}/${key}`;
}
