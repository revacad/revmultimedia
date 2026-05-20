import type { Metadata } from 'next'
import { PrivacyPolicyContent } from '@/components/public/legal/PrivacyPolicyContent'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Rev Multimedia Academy collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return <PrivacyPolicyContent />
}
