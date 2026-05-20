'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/Button'
import ScatteredAvatars from '@/components/public/ScatteredAvatars'
import { publicSectionClass } from '@/lib/public-ui'
import { cn } from '@/lib/utils'

export default function AboutPageClient() {
  useEffect(() => {
    let ctx: { revert: () => void } | undefined

    const loadGSAP = async () => {
      const { gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)

      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.from(el, {
            scrollTrigger: { trigger: el, start: 'top 85%' },
            y: 32,
            opacity: 0,
            duration: 0.65,
            ease: 'power3.out',
          })
        })
      })
    }

    void loadGSAP()

    return () => {
      ctx?.revert()
      void import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.getAll().forEach((t) => t.kill())
      })
    }
  }, [])

  return (
    <div>
      <section
        className={cn(
          publicSectionClass.gradient,
          'grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center',
        )}
      >
        <div className="reveal text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Our story</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
            We started Rev Multimedia because Ghana deserved better creative training.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/85">
            Too many talented people across Ghana and West Africa were teaching themselves from
            YouTube tutorials &mdash; picking up bad habits, missing foundations, and struggling to
            compete professionally. Rev Multimedia was built to change that with deep,
            structured, industry-relevant creative education.
          </p>
        </div>
        <div className="reveal relative mx-auto h-[320px] w-full max-w-lg overflow-hidden rounded-2xl shadow-xl lg:h-[360px]">
          <Image
            src="/images/african-creatives-in-class.jpg"
            alt="African creatives in class"
            fill
            className="object-cover"
          />
        </div>
      </section>

      <section className={cn('reveal grid grid-cols-1 gap-8 md:grid-cols-2', publicSectionClass.white)}>
        {[
          {
            label: 'OUR MISSION',
            accent: '#C74A86',
            statement:
              'To equip people across Ghana and Africa with deep, practical creative skills in design, motion, and video that remain valuable in a world increasingly shaped by AI.',
          },
          {
            label: 'OUR VISION',
            accent: '#2DBFB8',
            statement:
              'A Ghana where creative professionals are not just consumers of global media but the ones producing it.',
          },
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-[20px] border border-gray-100 bg-surface p-10 shadow-card"
          >
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: card.accent }}
            >
              {card.label}
            </p>
            <p
              className="font-display text-[80px] leading-none"
              style={{ color: card.accent, opacity: 0.12, marginBottom: '-20px' }}
              aria-hidden
            >
              &ldquo;
            </p>
            <p className="font-display text-[22px] leading-snug text-dark">{card.statement}</p>
          </article>
        ))}
      </section>

      <section className={cn('reveal grid grid-cols-1 items-center gap-12 lg:grid-cols-2', publicSectionClass.white)}>
        <div>
          <p className="section-label">Founder</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-dark">Godfred Ferdinand Appiah</h2>
          <p className="mt-2 text-primary font-medium">Founder &amp; Lead Instructor</p>
          <p className="mt-6 text-base leading-relaxed text-gray-600">
            With a background spanning graphic design, motion graphics, and creative direction,
            Godfred built Rev Multimedia to close the gap between raw talent and professional-ready
            skills across Ghana and West Africa.
          </p>
          <Link href="/contact" className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'mt-6 inline-flex')}>
            Get in touch
          </Link>
        </div>
        <div className="relative">
          <div className="relative mx-auto h-[480px] max-h-[500px] w-full max-w-md overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/images/founder-Godfred-Ferdinand.jpg"
              alt="Godfred Ferdinand Appiah"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 left-6 rounded-xl bg-surface p-4 shadow-lg">
            <p className="font-semibold text-dark">Godfred Ferdinand Appiah</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Founder
            </p>
          </div>
        </div>
      </section>

      <section className={cn('reveal', publicSectionClass.muted)}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label">Academic partner</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-dark">
            Partnered with Ghana Technology University College
          </h2>
          <p className="mt-6 text-base leading-relaxed text-gray-600">
            Rev Multimedia operates in academic collaboration with GTUC &mdash; one of
            Ghana&apos;s foremost technology-focused institutions.
          </p>
          <div className="mx-auto mt-10 max-w-lg rounded-2xl bg-surface p-8 shadow-md">
            <p className="font-display text-5xl font-bold text-primary">GTUC</p>
            <p className="mt-2 text-sm text-gray-600">Ghana Technology University College</p>
            <a
              href="https://gtuc.edu.gh"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-6 inline-flex')}
            >
              Visit GTUC
            </a>
          </div>
        </div>
      </section>

      <section className={cn('reveal', publicSectionClass.white)}>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <ScatteredAvatars featuredLabel="Community" featuredName="50+ Trained" />
          <div>
            <h2 className="font-display text-4xl font-bold text-dark">The faces of Rev Multimedia</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Students, alumni, and instructors building Ghana&apos;s next generation of creative professionals.
            </p>
          </div>
        </div>
      </section>

      <section className={cn('reveal grid grid-cols-1 gap-10 lg:grid-cols-2', publicSectionClass.muted)}>
        <div>
          <h2 className="font-display text-3xl font-bold text-dark">Visit us</h2>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Phone', value: '+233 27 581 8525', href: 'tel:+233275818525' },
              { label: 'Email', value: 'info@revmultimediagh.com', href: 'mailto:info@revmultimediagh.com' },
              { label: 'Location', value: 'Weija, Accra, Ghana' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-surface-2 p-4">
                <p className="text-xs text-gray-400">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="mt-1 block font-medium text-dark hover:text-primary">
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-1 font-medium text-dark">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-md">
          <iframe
            title="Rev Multimedia location"
            src="https://maps.google.com/maps?q=Weija,Accra,Ghana&output=embed"
            width="100%"
            height="400"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="border-0"
          />
        </div>
      </section>
    </div>
  )
}
