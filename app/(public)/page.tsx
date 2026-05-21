import type { Metadata } from 'next'
import HomePageClient from '@/components/public/home/HomePageClient'
import { getFeaturedCoursesForHome } from '@/lib/courses/queries'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Rev Multimedia — Build skills that cannot be automated. Professional creative training in Accra, Ghana.',
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

  return <HomePageClient courses={courses} nextIntake={nextIntake} />
}
