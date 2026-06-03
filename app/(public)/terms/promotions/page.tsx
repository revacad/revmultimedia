import type { Metadata } from 'next'
import Link from 'next/link'
import { PROMO_TERMS_TEXT } from '@/lib/public/promo-terms'
import { siteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Promotional Terms | Rev Multimedia',
  description: 'Terms and conditions for Rev Multimedia promotional offers and discounts.',
  alternates: {
    canonical: `${siteUrl}/terms/promotions`,
  },
}

export default function PromotionalTermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="font-body text-sm font-semibold text-[#C74A86] hover:text-[#A83A72]"
      >
        ← Back to home
      </Link>
      <h1 className="mt-6 font-display text-3xl font-semibold text-[#1A1A2E]">
        Promotional terms
      </h1>
      <p className="mt-4 font-body text-base leading-relaxed text-[#5A5A7A]">
        {PROMO_TERMS_TEXT}
      </p>
    </div>
  )
}
