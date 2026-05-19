'use client'

import { useState } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/Button'
import { publicSectionClass } from '@/lib/public-ui'
import { cn } from '@/lib/utils'

const FAQ = [
  {
    q: 'How do I apply?',
    a: 'Visit the Apply page to start your application. You will verify your phone number and complete the form online.',
  },
  {
    q: 'Are international students welcome?',
    a: 'Yes. Online programmes are open worldwide. Hybrid and in-person courses may require travel to Accra for scheduled sessions.',
  },
  {
    q: 'What is the application fee?',
    a: 'The application fee is GHS 100. It is non-refundable and secures your place in the review process.',
  },
]

export default function ContactPageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div>
      <section className={publicSectionClass.gradient}>
        <h1 className="font-display text-5xl font-bold text-white">Let&apos;s talk.</h1>
        <p className="mt-4 max-w-xl text-lg text-white/85">
          Questions about courses, admissions, or partnerships? We&apos;re here to help.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Phone', value: '+233 27 581 8525', href: 'tel:+233275818525' },
            { label: 'Email', value: 'info@revmultimediagh.com', href: 'mailto:info@revmultimediagh.com' },
            { label: 'Location', value: 'Weija, Accra, Ghana' },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl bg-white/15 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase text-white/70">{c.label}</p>
              {c.href ? (
                <a href={c.href} className="mt-2 block font-semibold text-white hover:underline">
                  {c.value}
                </a>
              ) : (
                <p className="mt-2 font-semibold text-white">{c.value}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className={cn('grid grid-cols-1 gap-10 lg:grid-cols-2', publicSectionClass.white)}>
        <form
          className="rounded-2xl border border-brand-gray-100 bg-surface p-8 shadow-md"
          onSubmit={(e) => e.preventDefault()}
        >
          <h2 className="font-display text-2xl font-bold text-dark">Send a message</h2>
          <p className="mt-2 text-sm text-brand-gray-600">
            We typically respond within one business day.
          </p>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-dark">Name</span>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-brand-gray-200 bg-surface-2 px-4 py-3 text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Your name"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-dark">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-brand-gray-200 bg-surface-2 px-4 py-3 text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-dark">Message</span>
              <textarea
                rows={5}
                className="mt-1 w-full rounded-xl border border-brand-gray-200 bg-surface-2 px-4 py-3 text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="How can we help?"
              />
            </label>
            <button type="submit" className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-full')}>
              Send message
            </button>
          </div>
        </form>

        <div>
          <h2 className="font-display text-2xl font-bold text-dark">FAQ</h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((item, i) => (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border border-brand-gray-100 bg-surface-2"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-dark"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {item.q}
                  <span className="text-primary">{openFaq === i ? '&minus;' : '+'}</span>
                </button>
                {openFaq === i && (
                  <p className="border-t border-brand-gray-100 px-5 pb-4 pt-2 text-sm leading-relaxed text-brand-gray-600">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-brand-gray-600">
            Ready to apply?{' '}
            <Link href="/apply" className="font-semibold text-primary hover:text-primary-hover">
              Start your application &rarr;
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
