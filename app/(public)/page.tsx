import type { Metadata } from 'next'
import HomePageClient from '@/components/public/home/HomePageClient'
import { getFeaturedCoursesForHome } from '@/lib/courses/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Rev Multimedia Academy — Build skills that cannot be automated. Professional creative training in Accra, Ghana.',
}

export default async function HomePage() {
  const courses = await getFeaturedCoursesForHome();

  return <HomePageClient courses={courses} />;
}
