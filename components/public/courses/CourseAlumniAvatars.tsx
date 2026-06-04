'use client'

import { getCourseStudentCount } from '@/lib/courses/alumni'
import { cn } from '@/lib/utils'

interface CourseAlumniAvatarsProps {
  slug: string
  size?: 'sm' | 'lg'
  className?: string
}

const COUNT_SIZE = {
  sm: 'text-lg',
  lg: 'text-2xl',
} as const

export default function CourseAlumniAvatars({
  slug,
  size = 'lg',
  className,
}: CourseAlumniAvatarsProps) {
  const count = getCourseStudentCount(slug)

  return (
    <p
      className={cn(
        'font-display font-bold text-primary',
        COUNT_SIZE[size],
        className,
      )}
      style={{
        WebkitTextStroke: '1.5px white',
        paintOrder: 'stroke fill',
      }}
    >
      {count}+
    </p>
  )
}
