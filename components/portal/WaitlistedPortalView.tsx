import ReferenceCode from '@/components/ui/ReferenceCode'
import Badge from '@/components/ui/Badge'
import { formatApplicationDate } from '@/lib/applications/format'
import { formatCategory, formatMode } from '@/lib/courses/labels'
import type { CourseCategory, CourseMode } from '@/lib/courses/types'
import { firstName } from '@/lib/portal/timeline'

interface WaitlistedPortalViewProps {
  fullName: string
  reference: string
  waitlistPosition: number | null
  course: {
    title: string
    category: CourseCategory
    mode: CourseMode
  } | null
  intake: {
    name: string
    start_date: string
  } | null
}

export default function WaitlistedPortalView({
  fullName,
  reference,
  waitlistPosition,
  course,
  intake,
}: WaitlistedPortalViewProps) {
  return (
    <div className="mx-auto max-w-[560px] px-6 py-8">
      <section className="mb-6 rounded-xl bg-white p-6 shadow-card text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3EEFF]">
          <svg
            className="h-8 w-8 text-[#7B5AE8]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="font-display text-[28px] font-semibold text-[#1A1A2E]">
          Hello, {firstName(fullName)}
        </h1>
        <p className="mt-2 font-body text-[15px] text-[#9898B8]">You are on the waitlist</p>
        <div className="mt-5 flex justify-center">
          <ReferenceCode code={reference} theme="light" label="Application reference" />
        </div>
      </section>

      {waitlistPosition != null && (
        <section className="mb-6 rounded-xl border border-[#7B5AE8]/25 bg-[#F3EEFF] p-6 text-center shadow-card">
          <p className="font-display text-3xl font-semibold text-[#7B5AE8]">
            You are #{waitlistPosition} on the waitlist
          </p>
        </section>
      )}

      {course && (
        <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-3 font-body text-base font-semibold text-[#1A1A2E]">Your course</h2>
          <p className="font-display text-[22px] font-semibold text-[#1A1A2E]">{course.title}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={course.category}>{formatCategory(course.category)}</Badge>
            <Badge variant={course.mode}>{formatMode(course.mode)}</Badge>
          </div>
          {intake && (
            <p className="mt-3 font-body text-sm text-[#5A5A7A]">
              Intake: {intake.name} · starts {formatApplicationDate(intake.start_date)}
            </p>
          )}
        </section>
      )}

      <section className="rounded-xl bg-white p-6 shadow-card">
        <p className="font-body text-sm leading-relaxed text-[#5A5A7A]">
          Thank you for applying. The intake you selected is currently full, so we have placed you
          on the waitlist. We will contact you by email and SMS when a spot may become available.
        </p>
        <p className="mt-4 font-body text-sm font-semibold text-[#1A1A2E]">
          No payment is required at this time. We will contact you when a spot becomes available.
        </p>
      </section>
    </div>
  )
}
