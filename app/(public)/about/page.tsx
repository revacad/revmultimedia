import type { Metadata } from 'next'
import AboutPageClient from '@/components/public/about/AboutPageClient'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Rev Multimedia, founded by Godfred Ferdinand Appiah, and our partnership with Ghana Technology University College.',
}

export default function AboutPage() {
  return <AboutPageClient />
}
