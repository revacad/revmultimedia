import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { formatCategory, formatMode } from '@/lib/courses/labels'
import type { Course } from '@/lib/courses/types'
import { formatGHS } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import CoursePublishToggle from '@/components/admin/courses/CoursePublishToggle'
import CourseDeleteButton from '@/components/admin/courses/CourseDeleteButton'

interface CourseTableProps {
  courses: Course[]
  fetchError?: string | null
}

export default function CourseTable({ courses, fetchError = null }: CourseTableProps) {
  if (fetchError) {
    return <ErrorState message="We could not load this data. Please refresh the page." />
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        }
        message="No courses yet"
        description="Create your first course to show it on the public site."
        action={{ label: 'Create your first course', href: '/admin/courses/new' }}
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Title
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Category
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Mode
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Fee
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Status
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr
              key={course.id}
              className="border-b border-gray-100 hover:bg-gray-50/80"
            >
              <td className="px-4 py-3 font-medium text-dark">{course.title}</td>
              <td className="px-4 py-3">
                <Badge variant={course.category}>{formatCategory(course.category)}</Badge>
              </td>
              <td className="px-4 py-3 text-gray-600">{formatMode(course.mode)}</td>
              <td className="px-4 py-3 text-gray-600">{formatGHS(course.tuition_fee_ghs)}</td>
              <td className="px-4 py-3">
                <CoursePublishToggle courseId={course.id} isPublished={course.is_published} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="text-sm font-medium text-[#5A5A7A] hover:text-dark"
                  >
                    Edit
                  </Link>
                  <CourseDeleteButton courseId={course.id} courseTitle={course.title} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
