import Link from 'next/link'
import Button from '@/components/ui/Button'
import CourseTable from '@/components/admin/courses/CourseTable'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { getAllCoursesAdmin } from '@/lib/courses/queries'

export const metadata = {
  title: 'Courses — Admin',
}

export default async function AdminCoursesPage() {
  await requireAdmin()
  const courses = await getAllCoursesAdmin()
  const published = courses.filter((c) => c.is_published).length
  const drafts = courses.length - published

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-dark">Courses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage programmes shown on the public site.
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button variant="primary">New Course</Button>
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total courses', value: courses.length },
          { label: 'Published', value: published },
          { label: 'Drafts', value: drafts },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-dark">{stat.value}</p>
          </div>
        ))}
      </div>

      <CourseTable courses={courses} />
    </div>
  )
}
