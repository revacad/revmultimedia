import type { Metadata } from 'next'
import { TermsContent } from '@/components/public/legal/TermsContent'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Rev Multimedia Academy services.',
}

export default function TermsPage() {
  return <TermsContent />
}
