import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BreadcrumbJsonLd, CourseJsonLd } from '@/components/seo/JsonLd'
import CourseDetailView from '@/components/public/courses/CourseDetailView'
import { getCourseBySlug } from '@/lib/courses/queries'
import { getPublicUrl } from '@/lib/r2/presign'
import {
  courseTitle,
  plainCourseDescription,
  siteUrl,
  stripHtml,
} from '@/lib/seo'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const supabase = await createServerClient()
    const { data: courses } = await supabase
      .from('courses')
      .select('slug')
      .eq('is_published', true)
    return (courses || []).map((course) => ({ slug: course.slug }))
  } catch {
    return []
  }
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

  if (!course) {
    return {
      title: 'Course Not Found | Rev Multimedia',
    }
  }

  const title = courseTitle(course.title)
  const description = plainCourseDescription(
    course.title,
    course.description ||
      `Learn ${course.title} from working professionals in Accra, Ghana.`,
  )

  let ogImage = `${siteUrl}/images/og-default.jpg`
  if (course.thumbnail_r2_key) {
    try {
      ogImage = course.thumbnail_r2_key.startsWith('http')
        ? course.thumbnail_r2_key
        : getPublicUrl(course.thumbnail_r2_key)
    } catch {
      ogImage = `${siteUrl}/images/og-default.jpg`
    }
  }

  return {
    title,
    description,
    keywords: [
      `${course.title} Ghana`,
      `${course.title} Accra`,
      `${course.title} course`,
      `${course.title} training`,
      `learn ${course.title} Ghana`,
      'creative design school Ghana',
      'Rev Multimedia',
      'GCTU accredited',
      'GTUC accredited',
      'design school Accra',
      'graphic design Ghana',
      'creative training Ghana',
    ].join(', '),
    openGraph: {
      title,
      description,
      url: `${siteUrl}/courses/${slug}`,
      siteName: 'Rev Multimedia',
      locale: 'en_GH',
      type: 'article',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${course.title} course at Rev Multimedia, Accra Ghana`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${siteUrl}/courses/${slug}`,
    },
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params
  const course = await getCourseBySlug(slug)

  if (!course) {
    notFound()
  }

  const jsonDescription = course.description
    ? stripHtml(course.description)
    : `Learn ${course.title} from working professionals in Accra, Ghana.`

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteUrl },
          { name: 'Courses', url: `${siteUrl}/courses` },
          { name: course.title, url: `${siteUrl}/courses/${slug}` },
        ]}
      />
      <CourseJsonLd
        name={course.title}
        description={jsonDescription}
        url={`${siteUrl}/courses/${slug}`}
      />
      <CourseDetailView course={course} />
    </>
  )
}
