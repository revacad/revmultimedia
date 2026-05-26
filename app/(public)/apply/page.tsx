import type { Metadata } from 'next'
import ApplyPageClient from '@/components/public/apply/ApplyPageClient'
import { mapApplyCourses } from '@/lib/apply/map-courses'
import { withCache } from '@/lib/redis/cache'
import { siteUrl } from '@/lib/seo'
import { createServerClient } from '@/lib/supabase/server'
import { applySearchParamsSchema } from '@/lib/validations/common'

export const metadata: Metadata = {
  title: 'Apply Now | Creative Design Courses in Ghana, Rev Multimedia',
  description:
    'Apply to study Graphic Design, Motion Graphics, Video Editing, Brand Identity, Packaging Design, or Advertising Design at Rev Multimedia in Accra, Ghana. Application fee is GHS 100. GCTU partner institution. Classes held at the GCTU campus.',
  keywords: [
    'apply graphic design Ghana',
    'design school application Ghana',
    'Rev Multimedia apply',
    'creative design admission Ghana',
    'GCTU design course application',
    'GTUC design course application',
    'design school Accra apply',
  ].join(', '),
  openGraph: {
    title: 'Apply to Rev Multimedia | Creative Design School Ghana',
    description:
      'Start your creative career. Apply to study Graphic Design, Motion Graphics, or Video Editing at Rev Multimedia in Accra, Ghana.',
    url: `${siteUrl}/apply`,
    siteName: 'Rev Multimedia',
    locale: 'en_GH',
    type: 'website',
  },
  alternates: {
    canonical: `${siteUrl}/apply`,
  },
}

async function fetchPublishedCourses() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('courses')
    .select('id, title, slug, category, mode, tuition_fee_ghs, intakes(*)')
    .eq('is_published', true)
    .order('title')
  return mapApplyCourses(data || [])
}

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; intake?: string }>
}) {
  const rawParams = await searchParams
  const parsedParams = applySearchParamsSchema.safeParse(rawParams)
  const params = parsedParams.success ? parsedParams.data : {}
  const courses = await withCache('courses:published', 300, fetchPublishedCourses)

  return (
    <ApplyPageClient
      courses={courses}
      preselectedCourse={params.course}
      preselectedIntake={params.intake}
    />
  )
}
