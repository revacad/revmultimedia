'use client'

import { getCourseStudentCount } from '@/lib/courses/alumni'
import { cn } from '@/lib/utils'

interface CourseAlumniAvatarsProps {
  slug: string
  size?: 'sm' | 'lg'
  className?: string
}

const STROKE_STYLE = {
  WebkitTextStroke: '1.5px white',
  paintOrder: 'stroke fill' as const,
}

export default function CourseAlumniAvatars({
  slug,
  size = 'lg',
  className,
}: CourseAlumniAvatarsProps) {
  const count = getCourseStudentCount(slug)

  if (size === 'sm') {
    return (
      <div
        className={cn(
          'absolute bottom-2 right-2 flex flex-col items-end p-2 text-right',
          className,
        )}
      >
        <span
          className="font-display text-[14px] font-bold leading-none"
          style={{ ...STROKE_STYLE, color: '#E8007D' }}
        >
          {count}+
        </span>
        <span
          className="mt-0.5 font-body text-[10px] font-semibold leading-none text-white"
          style={STROKE_STYLE}
        >
          enrolled
        </span>
      </div>
    )
  }

  return (
    <p
      className={cn('font-display text-2xl font-bold text-primary', className)}
      style={STROKE_STYLE}
    >
      {count}+
    </p>
  )
}
