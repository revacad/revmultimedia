import { getInitials } from '@/lib/applications/format'
import { generatePresignedDownloadUrl } from '@/lib/r2/presign'

interface AdminStudentAvatarProps {
  fullName: string
  photoKey: string | null
}

export default async function AdminStudentAvatar({
  fullName,
  photoKey,
}: AdminStudentAvatarProps) {
  let photoUrl: string | null = null
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME

  if (photoKey && bucket) {
    photoUrl = await generatePresignedDownloadUrl(bucket, photoKey, 3600)
  }

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className="h-14 w-14 shrink-0 rounded-full object-cover"
      />
    )
  }

  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white"
      style={{ background: 'linear-gradient(135deg, #C74A86, #F18F3B)' }}
    >
      <span className="font-body text-xl font-bold">{getInitials(fullName)}</span>
    </div>
  )
}
