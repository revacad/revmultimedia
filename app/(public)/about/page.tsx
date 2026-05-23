import type { Metadata } from 'next'
import { AboutPageClient } from '@/components/public/about/AboutPageClient'
import { siteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About Us | Rev Multimedia, Creative Design School in Ghana',
  description:
    'Rev Multimedia is a creative training institution and studio based in Weija, Accra, Ghana. We train Ghanaian and African creatives in Graphic Design, Motion Graphics, Video Editing, and visual content production. Operating in partnership with Ghana Communication Technology University (GCTU). Classes are held at the GCTU campus.',
  keywords: [
    'about Rev Multimedia',
    'creative school Ghana',
    'design school Accra',
    'GCTU',
    'Ghana Communication Technology University',
    'GTUC',
    'Ghana Technology University College',
    'ghana telecom',
    'creative training Ghana',
    'Godfred Ferdinand Appiah',
    'design instructors Ghana',
    'Weija Accra Ghana',
    'African creative institution',
  ].join(', '),
  openGraph: {
    title: 'About Rev Multimedia | Creative Design School in Accra, Ghana',
    description:
      'Learn about Rev Multimedia, a practitioner-led creative training institution in Weija, Accra. GCTU partner courses in Graphic Design, Motion Graphics, and Video Editing. Classes held at the GCTU campus.',
    url: `${siteUrl}/about`,
    siteName: 'Rev Multimedia',
    locale: 'en_GH',
    type: 'website',
  },
  alternates: {
    canonical: `${siteUrl}/about`,
  },
}

export default function AboutPage() {
  return <AboutPageClient />
}
