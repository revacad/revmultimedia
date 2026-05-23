import type { Metadata } from 'next'
import ContactPageClient from '@/components/public/contact/ContactPageClient'
import { siteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Contact Us | Rev Multimedia, Weija Accra Ghana',
  description:
    'Get in touch with Rev Multimedia. We are located in Weija, Accra, Ghana. Contact us about our creative design courses, admissions, or general enquiries. Call +233 27 581 8525 or email info@revmultimedia.com.',
  keywords: [
    'contact Rev Multimedia',
    'Rev Multimedia address',
    'design school contact Ghana',
    'Weija Accra Ghana',
    'creative school Ghana contact',
    'admissions Rev Multimedia',
  ].join(', '),
  openGraph: {
    title: 'Contact Rev Multimedia | Weija, Accra Ghana',
    description:
      'Contact Rev Multimedia in Weija, Accra. Enquiries about our Graphic Design, Motion Graphics, and Video Editing courses.',
    url: `${siteUrl}/contact`,
    siteName: 'Rev Multimedia',
    locale: 'en_GH',
    type: 'website',
  },
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
}

export default function ContactPage() {
  return <ContactPageClient />
}
