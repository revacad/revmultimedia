import Image from 'next/image'
import { cn } from '@/lib/utils'

interface GhostCourseCardProps {
  title: string
  accent: 'primary' | 'secondary' | 'accent'
  icon: 'play' | 'cut' | 'pen'
  className?: string
  imageSrc?: string
}

export default function GhostCourseCard({
  title,
  accent,
  icon,
  className,
  imageSrc,
}: GhostCourseCardProps) {
  const iconColor =
    accent === 'primary'
      ? 'text-primary/40'
      : accent === 'secondary'
        ? 'text-secondary/40'
        : 'text-accent/40'

  return (
    <article
      className={cn(
        'relative flex min-h-[380px] w-full min-w-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-[20px] border-[1.5px] border-dashed border-gray-200 bg-surface-2',
        imageSrc && 'border-solid',
        className,
      )}
    >
      {imageSrc && (
        <>
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            style={{ objectFit: 'cover' }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-white/80" aria-hidden />
        </>
      )}
      <div className="relative z-10 flex flex-col items-center gap-3">
        {icon === 'play' ? (
          <svg
            className={cn('h-10 w-10', iconColor)}
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l7 4.5-7 4.5z" />
          </svg>
        ) : icon === 'pen' ? (
          <svg
            className={cn('h-10 w-10', iconColor)}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        ) : (
          <svg
            className={cn('h-10 w-10', iconColor)}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-5.758-5.758 3 3 0 005.758 5.758z"
            />
          </svg>
        )}
        <p className="font-display text-xl text-gray-400">{title}</p>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">Coming Soon</span>
      </div>
    </article>
  )
}
