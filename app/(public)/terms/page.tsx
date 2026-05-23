import type { Metadata } from 'next'
import { TermsContent } from '@/components/public/legal/TermsContent'
import { siteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Terms of Service | Rev Multimedia',
  description:
    'Terms and conditions for applying to, enrolling at, and using Rev Multimedia creative design courses and services in Accra, Ghana.',
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsPage() {
  return <TermsContent />
}
