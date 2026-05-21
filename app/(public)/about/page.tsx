import { AboutPageClient } from '@/components/public/about/AboutPageClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about Rev Multimedia — who we are, what we do, and the team behind the training.',
}

export default function AboutPage() {
  return <AboutPageClient />
}
