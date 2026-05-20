import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CourseDetailView from '@/components/public/courses/CourseDetailView'
import { getCourseBySlug, getPublishedCourses } from '@/lib/courses/queries'
import { createServerClient } from '@/lib/supabase/server'

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const courses = await getPublishedCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: course } = await supabase
    .from('courses')
    .select('title, description, thumbnail_r2_key')
    .eq('slug', slug)
    .single()

  if (!course) return { title: 'Course Not Found' }

  return {
    title: course.title,
    description:
      course.description ||
      `Study ${course.title} at Rev Multimedia Academy in Accra, Ghana.`,
    openGraph: {
      title: `${course.title} | Rev Multimedia Academy`,
      description: course.description || '',
      images: course.thumbnail_r2_key
        ? []
        : [{ url: '/images/african-creatives-in-class.jpg' }],
    },
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return <CourseDetailView course={course} />;
}
