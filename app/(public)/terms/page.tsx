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

import { getApplicationFeeGhs } from '@/lib/settings/application-fee'

export default async function TermsPage() {
  const applicationFeeGhs = await getApplicationFeeGhs()
  return <TermsContent applicationFeeGhs={applicationFeeGhs} />
}
