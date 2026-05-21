'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import CourseCard from '@/components/public/CourseCard'
import GhostCourseCard from '@/components/public/home/GhostCourseCard'
import InternationalWelcomeNote from '@/components/public/InternationalWelcomeNote'
import { buttonVariants } from '@/components/ui/Button'
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

const GHOST_FILLERS = [
  {
    title: 'Motion Graphics',
    accent: 'secondary' as const,
    icon: 'play' as const,
    imageSrc: '/images/digital-pen.jpg',
  },
]

function buildDisplaySlots(courses: Course[]) {
  const slots: Array<
    | { kind: 'course'; course: Course }
    | { kind: 'ghost'; ghost: (typeof GHOST_FILLERS)[number] }
  > = courses.map((course) => ({ kind: 'course' as const, course }))

  let ghostIndex = 0
  while (slots.length < 3 && ghostIndex < GHOST_FILLERS.length) {
    slots.push({ kind: 'ghost', ghost: GHOST_FILLERS[ghostIndex] })
    ghostIndex += 1
  }

  return slots
}

interface CoursesPageClientProps {
  courses: Course[]
  priorityCourseId?: string
}

export default function CoursesPageClient({
  courses,
  priorityCourseId,
}: CoursesPageClientProps) {
  const [category, setCategory] = useState<CourseCategory | 'all'>('all')
  const [mode, setMode] = useState<CourseMode | 'all'>('all')

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (category !== 'all' && course.category !== category) return false
      if (mode !== 'all' && course.mode !== mode) return false
      return true
    })
  }, [courses, category, mode])

  const displaySlots = useMemo(
    () => buildDisplaySlots(filteredCourses),
    [filteredCourses],
  )

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
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-gray-600">
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
                    : 'bg-surface-2 text-gray-600 hover:bg-surface-3',
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
                    : 'bg-surface-2 text-gray-600 hover:bg-surface-3',
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
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="absolute -bottom-4 -left-4 rounded-2xl bg-surface p-4 shadow-lg">
            <p className="text-xs text-gray-600">Open cohorts</p>
            <p className="font-display text-2xl font-bold text-primary">{courses.length}</p>
          </div>
        </div>
      </section>

      <section className={publicSectionClass.muted}>
        <div className="mb-8">
          <InternationalWelcomeNote />
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-8 py-16 text-center">
            <p className="font-display text-xl font-semibold text-dark">No courses published yet</p>
            <p className="mt-2 max-w-md text-sm text-gray-600">
              New programmes will appear here once they are published. Contact us if you have
              questions about upcoming cohorts.
            </p>
            <Link href="/contact" className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'mt-6')}>
              Contact us
            </Link>
          </div>
        ) : filteredCourses.length === 0 ? (
          <p className="text-center text-sm text-gray-600">
            No courses match your filters. Try adjusting category or mode.
          </p>
        ) : (
          <>
            <div className="grid w-full grid-cols-1 gap-6 md:hidden">
              {filteredCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  className="h-full min-h-[380px] w-full"
                  priority={
                    course.id === priorityCourseId ||
                    (priorityCourseId == null && index === 0)
                  }
                />
              ))}
            </div>
            <div className="hidden w-full grid-cols-1 gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
              {displaySlots.map((slot) => (
                <div
                  key={slot.kind === 'course' ? slot.course.id : slot.ghost.title}
                  className="min-w-0 w-full"
                >
                  {slot.kind === 'course' ? (
                    <CourseCard
                      course={slot.course}
                      className="h-full min-h-[380px] w-full"
                      priority={slot.course.id === priorityCourseId}
                    />
                  ) : (
                    <GhostCourseCard
                      title={slot.ghost.title}
                      accent={slot.ghost.accent}
                      icon={slot.ghost.icon}
                      imageSrc={slot.ghost.imageSrc}
                      className="h-full min-h-[380px] w-full"
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}
