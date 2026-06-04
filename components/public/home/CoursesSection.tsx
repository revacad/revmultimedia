import Link from 'next/link'
import CourseCard from '@/components/public/CourseCard'
import GhostCourseCard from '@/components/public/home/GhostCourseCard'
import { buildFeaturedSlots } from '@/lib/home/featured-slots'
import type { Course } from '@/lib/courses/types'
import { publicSectionClass } from '@/lib/public-ui'
import { cn } from '@/lib/utils'

interface CoursesSectionProps {
  courses: Course[]
}

export default function CoursesSection({ courses }: CoursesSectionProps) {
  const featuredSlots = buildFeaturedSlots(courses)
  const firstFeaturedCourseId = featuredSlots.find(
    (slot): slot is { kind: 'course'; course: Course } => slot.kind === 'course',
  )?.course.id

  return (
    <section className={cn('reveal-section', publicSectionClass.white)}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">Our Disciplines</p>
          <h2 className="section-headline mt-2 font-display text-4xl font-bold text-[#1A1A2E]">
            Three tracks. One goal.
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-2 text-sm font-semibold text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            Applications Open
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featuredSlots.map((slot) => (
          <div
            key={slot.kind === 'course' ? slot.course.id : slot.ghost.title}
            className="min-w-0 w-full"
          >
            {slot.kind === 'course' ? (
              <CourseCard
                course={slot.course}
                className="h-full w-full"
                priority={slot.course.id === firstFeaturedCourseId}
              />
            ) : (
              <GhostCourseCard
                title={slot.ghost.title}
                accent={slot.ghost.accent}
                icon={slot.ghost.icon}
                imageSrc={slot.ghost.imageSrc}
                className="h-full w-full"
              />
            )}
          </div>
        ))}
      </div>
      <p className="mt-8 text-center">
        <Link href="/courses" className="text-[15px] font-medium text-primary hover:text-primary-hover">
          View All Courses
        </Link>
      </p>
    </section>
  )
}
