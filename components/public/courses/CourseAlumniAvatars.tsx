'use client'

import { getCourseAlumni, getCourseStudentCount } from '@/lib/courses/alumni'
import { cn } from '@/lib/utils'

interface CourseAlumniAvatarsProps {
  slug: string
  size?: 'sm' | 'lg'
  className?: string
}

const SIZE = {
  sm: {
    avatar: 'h-8 w-8',
    overlap: '-ml-3',
    count: 'text-[11px]',
    label: 'text-[11px]',
  },
  lg: {
    avatar: 'h-11 w-11',
    overlap: '-ml-3',
    count: 'text-sm',
    label: 'text-xs',
  },
} as const

function hideBrokenImage(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

export default function CourseAlumniAvatars({
  slug,
  size = 'lg',
  className,
}: CourseAlumniAvatarsProps) {
  const alumni = getCourseAlumni(slug)
  const count = getCourseStudentCount(slug)
  const styles = SIZE[size]

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      <div className="flex items-center">
        {alumni.map((filename, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={filename}
            src={`/alumni/${filename}`}
            alt=""
            onError={hideBrokenImage}
            className={cn(
              styles.avatar,
              'shrink-0 rounded-full border-2 border-white object-cover object-top',
              index > 0 && styles.overlap,
            )}
          />
        ))}
      </div>
      <div className="text-right">
        <p className={cn('font-display font-bold text-primary', styles.count)}>{count}+</p>
        <p className={cn('text-gray-500', styles.label)}>students enrolled</p>
      </div>
    </div>
  )
}
