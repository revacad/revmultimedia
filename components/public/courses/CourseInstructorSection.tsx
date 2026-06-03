import { getInstructorPhotoSrc } from '@/lib/courses/instructor-photo'
import type { Course } from '@/lib/courses/types'

type InstructorCourse = Pick<
  Course,
  'instructor_name' | 'instructor_title' | 'instructor_bio' | 'instructor_photo_r2_key'
>

export default function CourseInstructorSection({ course }: { course: InstructorCourse }) {
  if (!course.instructor_name) return null

  const photoSrc = getInstructorPhotoSrc(course)

  return (
    <section>
      <h2 className="mb-4 font-display text-2xl font-semibold text-dark">Your instructor</h2>
      <div className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-surface-2 p-6 sm:flex-row sm:items-start">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#EFEFF5]">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt={course.instructor_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-[#5A5A7A]">
              {course.instructor_name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold text-dark">{course.instructor_name}</p>
          {course.instructor_title && (
            <p className="mt-1 font-body text-sm font-medium text-primary">{course.instructor_title}</p>
          )}
          {course.instructor_bio && (
            <p className="mt-3 font-body text-sm leading-relaxed text-gray-600 whitespace-pre-line">
              {course.instructor_bio}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
