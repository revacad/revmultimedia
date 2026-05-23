import type { Metadata } from 'next'
import { PrivacyPolicyContent } from '@/components/public/legal/PrivacyPolicyContent'
import { siteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Privacy Policy | Rev Multimedia',
  description:
    'How Rev Multimedia collects, uses, stores, and protects your personal information when you apply, enroll, or use our website and student portal in Ghana.',
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPage() {
  return <PrivacyPolicyContent />
}
