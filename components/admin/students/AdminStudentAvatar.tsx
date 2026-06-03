import { getInitials } from '@/lib/applications/format'

interface AdminStudentAvatarProps {
  fullName: string
  photoUrl?: string | null
  size?: 'sm' | 'md'
}

const SIZE_CLASS = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-xl',
} as const

export default function AdminStudentAvatar({
  fullName,
  photoUrl = null,
  size = 'md',
}: AdminStudentAvatarProps) {
  const sizeClass = SIZE_CLASS[size]

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-white ${sizeClass}`}
      style={{ background: 'linear-gradient(135deg, #C74A86, #F18F3B)' }}
    >
      <span className="font-body font-bold">{getInitials(fullName)}</span>
    </div>
  )
}
