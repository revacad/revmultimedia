'use client'

import { useState, useTransition } from 'react'
import { submitContactForm } from '@/actions/contact'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/Button'
import { publicSectionClass } from '@/lib/public-ui'
import { cn } from '@/lib/utils'

const FAQ = [
  {
    q: 'Who can apply to Rev Multimedia?',
    a: 'Anyone who wants to build a professional creative career. You do not need any prior experience — just commitment and a willingness to put in the work. We have students who started with zero design background and went on to work with clients professionally.',
  },
  {
    q: 'Are the courses available online?',
    a: 'Yes. Selected cohorts for all three disciplines run fully online via Zoom. These are open to students across Ghana and internationally. Check each course page for the mode of the upcoming intake.',
  },
  {
    q: 'Are international students welcome?',
    a: 'Yes. Online programmes are open worldwide. Hybrid and in-person courses may require travel to Accra for scheduled sessions.',
  },
  {
    q: 'How does the application process work?',
    a: 'You fill out an online application, pay a non-refundable application fee of GHS 100, and our admissions team reviews your application. If accepted, you receive a tuition invoice and payment instructions. Once tuition is paid, your enrollment is confirmed and you receive your student ID.',
  },
  {
    q: 'What is the tuition fee?',
    a: 'Tuition fees vary by course. You will find the fee for each course on its detail page. We offer structured payment plans — speak to us if you need flexibility.',
  },
  {
    q: 'Can I pay in installments?',
    a: 'Yes. We understand that paying a full tuition upfront is not always possible. Installment arrangements are available — contact us at info@revmultimediagh.com to discuss your situation.',
  },
  {
    q: 'Is the application fee refundable?',
    a: 'No. The application fee covers the cost of reviewing your application and is non-refundable regardless of the outcome.',
  },
  {
    q: 'Do I need a specific laptop or software?',
    a: 'You will need a laptop that can run Adobe Creative Cloud applications. Minimum specs and software requirements are shared with accepted students during onboarding. If you have concerns about your equipment, reach out before applying.',
  },
  {
    q: 'Does Rev Multimedia issue certificates?',
    a: 'Yes. Students who complete a course receive an official Rev Multimedia certificate. Our academic collaboration with Ghana Technology University College adds further institutional credibility to your training.',
  },
]

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn('h-5 w-5 shrink-0 text-primary transition-transform', open && 'rotate-180')}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function ContactPageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(false)
    startTransition(async () => {
      const result = await submitContactForm({ name, email, message })
      if (result.error) {
        setFormError(result.error)
        return
      }
      setFormSuccess(true)
      setName('')
      setEmail('')
      setMessage('')
    })
  }

  return (
    <div>
      <section className={publicSectionClass.gradient}>
        <h1 className="font-display text-5xl font-bold text-white">Let&apos;s talk.</h1>
        <p className="mt-4 max-w-xl text-lg text-white/85">
          Questions about courses, admissions, or partnerships? We&apos;re here to help.
        </p>
        <a
          href="https://wa.me/233275818525"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: 'accent', size: 'md' }),
            'mt-6 inline-flex',
          )}
        >
          <WhatsAppIcon />
          Chat on WhatsApp
        </a>
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
          className="rounded-2xl border border-gray-100 bg-surface p-8 shadow-md"
          onSubmit={handleContactSubmit}
        >
          <h2 className="font-display text-2xl font-bold text-dark">Send a message</h2>
          <p className="mt-2 text-sm text-gray-600">
            We typically respond within one business day.
          </p>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-dark">Name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-surface-2 px-4 py-3 text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Your name"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-dark">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-surface-2 px-4 py-3 text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-dark">Message</span>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-surface-2 px-4 py-3 text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="How can we help?"
              />
            </label>
            {formError && (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="text-sm text-[#1E9990]">Thank you — we received your message.</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-full disabled:opacity-50')}
            >
              {pending ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>

        <div>
          <h2 className="font-display text-2xl font-bold text-dark">Common questions</h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((item, i) => (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border border-gray-100 bg-surface-2"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-dark"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  {item.q}
                  <ChevronIcon open={openFaq === i} />
                </button>
                {openFaq === i && (
                  <p className="border-t border-gray-100 px-5 pb-4 pt-2 text-sm leading-relaxed text-gray-600">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-gray-600">
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
