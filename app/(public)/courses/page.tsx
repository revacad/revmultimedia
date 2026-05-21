import type { Metadata } from 'next'
import CoursesPageClient from '@/components/public/courses/CoursesPageClient'
import { getPublishedCourses } from '@/lib/courses/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Courses',
  description:
    'Explore our Graphic Design, Motion Graphics, and Video Editing courses. In-person in Accra and online cohorts available.',
}

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <CoursesPageClient
      courses={courses}
      priorityCourseId={courses[0]?.id}
    />
  );
}
