'use client'

import Link from 'next/link'
import type { ApplyCourse } from '@/lib/apply/types'
import { isIntakeFull, intakeSlotsRemaining } from '@/lib/apply/intake-availability'
import { getCourseThumbnailSrc } from '@/lib/courses/thumbnail'
import { getCategoryGradient } from '@/lib/courses/categories'
import { formatApplicationDate } from '@/lib/applications/format'
import { formatGHS } from '@/lib/utils'

interface PortalApplyCoursesSectionProps {
  courses: ApplyCourse[]
  enrolledCourseIds: string[]
}

function CourseCardHeader({ course }: { course: ApplyCourse }) {
  const hasThumbnail = Boolean(course.thumbnail_url ?? course.thumbnail_r2_key)
  const gradient = getCategoryGradient(course.category)

  if (hasThumbnail) {
    const src = getCourseThumbnailSrc(course)
    return (
      <div className="relative h-20 w-full shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className="flex h-20 w-full shrink-0 items-center justify-center"
      style={{ background: gradient }}
      aria-hidden
    >
      <span className="font-display text-lg font-bold text-white/95 drop-shadow-sm">
        {course.title.split(' ').slice(0, 2).join(' ')}
      </span>
    </div>
  )
}

export default function PortalApplyCoursesSection({
  courses,
  enrolledCourseIds,
}: PortalApplyCoursesSectionProps) {
  return (
    <section>
      <h2 className="mb-1 font-body text-lg font-semibold text-[#1A1A2E]">
        Apply for another course
      </h2>
      <p className="mb-5 font-body text-sm text-[#9898B8]">
        Explore programmes and start a new application with your existing student profile.
      </p>
      {courses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#EFEFF5] bg-white px-6 py-10 text-center font-body text-sm text-[#9898B8]">
          No courses are available to apply for right now. Check back soon or contact support.
        </p>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const nextIntake = course.intakes[0]
          const enrolled = enrolledCourseIds.includes(course.id)
          const full = nextIntake ? isIntakeFull(nextIntake) : true
          const spots = nextIntake ? intakeSlotsRemaining(nextIntake) : null

          return (
            <article
              key={course.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-[#EFEFF5] bg-white shadow-card"
            >
              <CourseCardHeader course={course} />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-semibold text-[#1A1A2E]">
                  {course.title}
                </h3>
                {nextIntake ? (
                  <p className="mt-2 font-body text-sm text-[#5A5A7A]">
                    {nextIntake.name} · starts {formatApplicationDate(nextIntake.start_date)}
                  </p>
                ) : (
                  <p className="mt-2 font-body text-sm text-[#9898B8]">No open intake</p>
                )}
                <p className="mt-1 font-body text-sm text-[#9898B8]">
                  {spots != null ? `${spots} spot${spots === 1 ? '' : 's'} remaining` : 'Open intake'}
                </p>
                <p className="mt-2 font-body text-sm font-semibold text-[#1A1A2E]">
                  {formatGHS(course.tuition_fee_ghs)}
                </p>
                <div className="mt-4">
                  {enrolled ? (
                    <span className="inline-flex rounded-full bg-[#EBF9F8] px-4 py-2 font-body text-xs font-semibold text-[#1E9990]">
                      Currently enrolled
                    </span>
                  ) : !nextIntake ? (
                    <span className="inline-flex rounded-full bg-[#F0F0F8] px-4 py-2 font-body text-xs font-semibold text-[#9898B8]">
                      Unavailable
                    </span>
                  ) : full ? (
                    <Link
                      href={`/portal/apply?course=${course.id}&intake=${nextIntake.id}`}
                      className="inline-flex rounded-full bg-[#EFEFF5] px-5 py-2.5 font-body text-sm font-semibold text-[#5A5A7A] hover:bg-[#E0E0EC]"
                    >
                      Join waitlist
                    </Link>
                  ) : (
                    <Link
                      href={`/portal/apply?course=${course.id}&intake=${nextIntake.id}`}
                      className="inline-flex rounded-full bg-[#1A1A2E] px-5 py-2.5 font-body text-sm font-semibold text-white hover:bg-[#252540]"
                    >
                      Apply
                    </Link>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
      )}
    </section>
  )
}
