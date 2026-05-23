import type { Metadata } from 'next'
import HomePageClient from '@/components/public/home/HomePageClient'
import { FaqJsonLd, LocalBusinessJsonLd } from '@/components/seo/JsonLd'
import { getFeaturedCoursesForHome } from '@/lib/courses/queries'
import { siteKeywords, siteUrl } from '@/lib/seo'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rev Multimedia | Creative Design School in Accra, Ghana',
  description:
    'Learn Graphic Design, Motion Graphics, Video Editing, Brand Identity, Packaging and Advertising Design in Accra, Ghana. Rev Multimedia is a practitioner-led creative training institution in partnership with GCTU. Classes held at the GCTU campus.',
  keywords: siteKeywords,
  openGraph: {
    title: 'Rev Multimedia | Creative Design School in Accra, Ghana',
    description:
      'Professional creative design training in Accra, Ghana. Courses in Graphic Design, Motion Graphics, Video Editing, Brand Identity and more. GCTU partner institution.',
    url: siteUrl,
    siteName: 'Rev Multimedia',
    locale: 'en_GH',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/images/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: 'Rev Multimedia, Creative Design School in Accra Ghana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rev Multimedia | Creative Design School in Ghana',
    description:
      'Professional creative design training in Accra, Ghana. Graphic Design, Motion Graphics, Video Editing and more.',
    images: [`${siteUrl}/images/og-default.jpg`],
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function HomePage() {
  const courses = await getFeaturedCoursesForHome()
  const supabase = await createServerClient()

  const today = new Date().toISOString().split('T')[0]
  const { data: rawIntake } = await supabase
    .from('intakes')
    .select('id, name, start_date, courses(title)')
    .gte('start_date', today)
    .eq('is_closed', false)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  const courseRelation = rawIntake?.courses
  const nextIntake = rawIntake
    ? {
        id: rawIntake.id,
        name: rawIntake.name,
        start_date: rawIntake.start_date,
        courses: Array.isArray(courseRelation)
          ? (courseRelation[0] ?? null)
          : (courseRelation ?? null),
      }
    : null

  return (
    <>
      <FaqJsonLd />
      <LocalBusinessJsonLd />
      <HomePageClient courses={courses} nextIntake={nextIntake} />
    </>
  )
}
