'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/Button'
import { publicSectionClass } from '@/lib/public-ui'
import { cn } from '@/lib/utils'

const INSTRUCTORS = [
  { img: 'person1.webp', name: 'Instructor', role: 'Graphic Design Lead' },
  { img: 'person2.webp', name: 'Instructor', role: 'Motion Graphics' },
  { img: 'person3.webp', name: 'Instructor', role: 'Video Editing' },
  { img: 'person4.webp', name: 'Instructor', role: 'Brand Identity' },
  { img: 'person5.webp', name: 'Instructor', role: 'Visual Design' },
  { img: 'person6.webp', name: 'Instructor', role: 'Photography' },
  { img: 'person7.webp', name: 'Instructor', role: 'Creative Direction' },
] as const

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

      <section
        className="reveal py-16 md:py-20"
        style={{ backgroundColor: '#F7F8FC' }}
      >
        <div className="mx-auto max-w-[1200px] px-6 md:px-12">
          <p
            className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.08em]"
            style={{ color: '#C74A86' }}
          >
            Our Instructors
          </p>
          <h2 className="mb-3 font-display text-3xl font-bold text-dark md:text-4xl">
            Learn from working creatives.
          </h2>
          <p
            className="mb-12 max-w-[520px] font-body text-base leading-relaxed"
            style={{ color: '#5A5A7A' }}
          >
            Our instructors are not theorists. They are practitioners who have built real careers in
            design, motion, and video production across Ghana and internationally.
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {INSTRUCTORS.map((instructor) => (
              <div
                key={instructor.img}
                className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_2px_16px_rgba(26,26,46,0.08)] transition-[transform,box-shadow] duration-250 ease-out hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(26,26,46,0.14)]"
              >
                <div className="relative h-[220px] overflow-hidden">
                  <Image
                    src={`/members/${instructor.img}`}
                    alt={instructor.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="px-5 py-4">
                  <p className="mb-1 font-display text-base font-semibold text-dark">
                    {instructor.name}
                  </p>
                  <p className="font-body text-[13px] text-primary">{instructor.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cn('reveal', publicSectionClass.white)}>
        <div className="mx-auto max-w-[1200px]">
          <p className="section-label">Our Alumni</p>
          <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-md font-display text-3xl font-bold text-dark md:text-4xl">
              100+ creatives trained and working.
            </h2>
            <Link
              href="/apply"
              className={cn(
                buttonVariants({ variant: 'primary', size: 'md' }),
                'inline-flex shrink-0 self-start sm:self-auto',
              )}
            >
              Join them
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-3">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'relative overflow-hidden rounded-2xl',
                  i % 3 === 0 ? 'h-[260px]' : 'h-[200px]',
                )}
              >
                <Image
                  src={`/alumni/pers${i + 1}.jpg`}
                  alt={`Alumni ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
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
