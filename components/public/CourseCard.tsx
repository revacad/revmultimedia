'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatMode } from '@/lib/courses/labels'
import { buttonVariants } from '@/components/ui/Button'
import { formatCategory } from '@/lib/courses/labels'
import { getCourseThumbnailSrc } from '@/lib/courses/thumbnail'
import { getSlotIndicator } from '@/lib/courses/slots'
import type { Course } from '@/lib/courses/types'
import { cn, formatGHS } from '@/lib/utils'

interface CourseCardProps {
  course: Course
  showApplyButton?: boolean
  className?: string
}

export default function CourseCard({
  course,
  showApplyButton = true,
  className,
}: CourseCardProps) {
  const thumbnailSrc = getCourseThumbnailSrc(course)
  const slotIndicator = getSlotIndicator(course.intakes)

  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        'group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-brand-gray-100 bg-surface shadow-card transition-all duration-300',
        'hover:-translate-y-2 hover:border-primary/30 hover:shadow-xl',
        className,
      )}
    >
      <div className="relative h-[220px] overflow-hidden">
        <Image
          src={thumbnailSrc}
          alt={course.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/40 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary shadow-sm">
            {formatCategory(course.category)}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-accent shadow-sm">
            {formatMode(course.mode)}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 backdrop-blur-sm">
          <div className="relative h-6 w-6 overflow-hidden rounded-full">
            <Image
              src="/members/person4.webp"
              alt="Instructor"
              width={24}
              height={24}
              className="object-cover"
            />
          </div>
          <span className="text-xs font-semibold text-dark">Godfred F.</span>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-dark/70 px-3 py-1 text-xs text-white">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          12 weeks
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-lg font-semibold text-dark group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        {course.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-brand-gray-600">
            {course.description}
          </p>
        )}


        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-primary">
            {formatGHS(course.tuition_fee_ghs)}
          </span>
          {showApplyButton && (
            <span
              className={cn(
                buttonVariants({ variant: 'primary', size: 'sm' }),
                'pointer-events-none',
              )}
            >
              Apply Now
            </span>
          )}
        </div>
        <div className={cn('mt-2 flex items-center gap-1.5 text-xs font-medium', slotIndicator.colorClass)}>
          <span className={cn('h-2 w-2 rounded-full', slotIndicator.dotClass)} />
          {slotIndicator.text}
        </div>
      </div>
    </Link>
  )
}
