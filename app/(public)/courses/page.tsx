import type { Metadata } from 'next'
import CoursesPageClient from '@/components/public/courses/CoursesPageClient'
import { getPublishedCourses } from '@/lib/courses/queries'
import { siteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Courses | Graphic Design, Motion Graphics and Video Editing in Ghana',
  description:
    'Explore professional creative design courses at Rev Multimedia in Accra, Ghana. We offer training in Graphic Design, Brand Identity Design, Packaging Design, Advertising Design, Editorial Design, Motion Graphics, and Video Editing. GCTU partner institution. Classes held at the GCTU campus.',
  keywords: [
    'graphic design course Accra',
    'motion graphics course Ghana',
    'video editing training Ghana',
    'brand identity design course',
    'packaging design Ghana',
    'advertising design course',
    'editorial design Ghana',
    'print design training',
    'creative design courses Ghana',
    'GCTU partner design',
    'GTUC accredited design',
    'design school Accra Ghana',
    'Rev Multimedia courses',
  ].join(', '),
  openGraph: {
    title: 'Creative Design Courses in Ghana | Rev Multimedia',
    description:
      'Professional courses in Graphic Design, Motion Graphics, Video Editing, Brand Identity, Packaging and Advertising Design in Accra, Ghana.',
    url: `${siteUrl}/courses`,
    siteName: 'Rev Multimedia',
    locale: 'en_GH',
    type: 'website',
  },
  alternates: {
    canonical: `${siteUrl}/courses`,
  },
}

export default async function CoursesPage() {
  const courses = await getPublishedCourses()

  return (
    <CoursesPageClient courses={courses} priorityCourseId={courses[0]?.id} />
  )
}
