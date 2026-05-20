import type { Metadata } from 'next'
import ContactPageClient from '@/components/public/contact/ContactPageClient'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Rev Multimedia Academy. Located in Weija, Accra, Ghana. Call +233 27 581 8525.',
}

export default function ContactPage() {
  return <ContactPageClient />
}
