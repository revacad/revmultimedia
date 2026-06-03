import type { Metadata } from 'next'
import ApplyChooser from '@/components/public/apply/ApplyChooser'
import { pickRandomQuote } from '@/lib/quotes'
import { siteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Apply Now | Rev Multimedia',
  description:
    'Apply to Rev Multimedia in Ghana. Choose standard application or Senior High School Level Up for senior high school students.',
  alternates: {
    canonical: `${siteUrl}/apply`,
  },
}

export default function ApplyChooserPage() {
  const quote = pickRandomQuote()
  return <ApplyChooser quote={quote} />
}
