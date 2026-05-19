'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import CourseCard from '@/components/public/CourseCard'
import InternationalWelcomeNote from '@/components/public/InternationalWelcomeNote'
import { withPreviewCourses } from '@/lib/courses/preview'
import { publicSectionClass } from '@/lib/public-ui'
import { cn } from '@/lib/utils'
import type { Course, CourseCategory, CourseMode } from '@/lib/courses/types'

const CATEGORY_FILTERS: { value: CourseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'graphic_design', label: 'Graphic Design' },
  { value: 'motion_graphics', label: 'Motion Graphics' },
  { value: 'video_editing', label: 'Video Editing' },
]

const MODE_FILTERS: { value: CourseMode | 'all'; label: string }[] = [
  { value: 'all', label: 'All modes' },
  { value: 'online', label: 'Online' },
  { value: 'in_person', label: 'In-Person' },
  { value: 'hybrid', label: 'Hybrid' },
]

interface CoursesPageClientProps {
  courses: Course[]
}

export default function CoursesPageClient({ courses }: CoursesPageClientProps) {
  const [category, setCategory] = useState<CourseCategory | 'all'>('all')
  const [mode, setMode] = useState<CourseMode | 'all'>('all')

  const displayCourses = useMemo(() => withPreviewCourses(courses), [courses])

  const filtered = useMemo(() => {
    return displayCourses.filter((course) => {
      if (category !== 'all' && course.category !== category) return false
      if (mode !== 'all' && course.mode !== mode) return false
      return true
    })
  }, [displayCourses, category, mode])

  return (
    <>
      <section
        className={cn(
          publicSectionClass.white,
          'grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center',
        )}
      >
        <div>
          <p className="section-label">Programmes</p>
          <h1 className="mt-3 font-display text-5xl font-bold text-dark md:text-6xl">Our courses</h1>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-brand-gray-600">
            Structured pathways in graphic design, motion graphics, and video editing &mdash; taught
            by practitioners, not theorists.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setCategory(filter.value)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  category === filter.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-2 text-brand-gray-600 hover:bg-surface-3',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {MODE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setMode(filter.value)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  mode === filter.value
                    ? 'bg-accent text-dark'
                    : 'bg-surface-2 text-brand-gray-600 hover:bg-surface-3',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="relative h-[260px] overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/images/color-scheme.jpg"
              alt="Graphic design"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 rounded-2xl bg-surface p-4 shadow-lg">
            <p className="text-xs text-brand-gray-500">Open cohorts</p>
            <p className="font-display text-2xl font-bold text-primary">{displayCourses.length}+</p>
          </div>
        </div>
      </section>

      <section className={publicSectionClass.muted}>
        <div className="mb-8">
          <InternationalWelcomeNote />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-gray-200 bg-white py-20 text-center">
            <p className="mb-2 font-display text-2xl text-brand-gray-400">
              No courses match these filters
            </p>
            <p className="text-sm text-brand-gray-500">
              Try another category or check back soon for new cohorts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <div key={course.id} className="min-w-0 w-full">
                <CourseCard course={course} className="h-full w-full" />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
