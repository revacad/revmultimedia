import { getInstructorPhotoSrc } from '@/lib/courses/instructor-photo'
import type { Course } from '@/lib/courses/types'

type InstructorCourse = Pick<
  Course,
  'instructor_name' | 'instructor_title' | 'instructor_photo_r2_key'
>

interface CourseInstructorPillProps {
  course: InstructorCourse
  className?: string
  compact?: boolean
}

export default function CourseInstructorPill({
  course,
  className = '',
  compact = false,
}: CourseInstructorPillProps) {
  if (!course.instructor_name) return null

  const photoSrc = getInstructorPhotoSrc(course)
  const displayName = compact
    ? course.instructor_name.split(' ').slice(0, 2).map((p) => p[0]).join('. ') ||
      course.instructor_name
    : course.instructor_name

  return (
    <div
      className={`flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 backdrop-blur-sm ${className}`}
    >
      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#EFEFF5]">
        {photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoSrc}
            alt={`${course.instructor_name}${course.instructor_title ? `, ${course.instructor_title}` : ''}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-body text-[10px] font-bold text-[#5A5A7A]">
            {course.instructor_name.charAt(0)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <span className="block truncate text-xs font-semibold text-dark">{displayName}</span>
        {!compact && course.instructor_title && (
          <span className="block truncate text-[10px] text-gray-500">{course.instructor_title}</span>
        )}
      </div>
    </div>
  )
}
