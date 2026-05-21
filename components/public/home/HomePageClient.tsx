'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'
import { publicSectionClass } from '@/lib/public-ui'
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/Button'
import CourseCard from '@/components/public/CourseCard'
import GhostCourseCard from '@/components/public/home/GhostCourseCard'

const OrbitalAvatars = dynamic(
  () => import('@/components/public/OrbitalAvatars').then((m) => m.OrbitalAvatars),
  { ssr: false },
)
import type { Course } from '@/lib/courses/types'
import { cn } from '@/lib/utils'

const GHOST_FILLERS = [
  {
    title: 'Graphic Design',
    accent: 'primary' as const,
    icon: 'pen' as const,
    imageSrc: '/images/color-scheme.jpg',
  },
  {
    title: 'Motion Graphics',
    accent: 'secondary' as const,
    icon: 'play' as const,
    imageSrc: '/images/digital-pen.jpg',
  },
  {
    title: 'Video Editing',
    accent: 'accent' as const,
    icon: 'cut' as const,
    imageSrc: '/images/timeline.jpg',
  },
]

function buildFeaturedSlots(courses: Course[]) {
  const slots: Array<
    | { kind: 'course'; course: Course }
    | { kind: 'ghost'; ghost: (typeof GHOST_FILLERS)[number] }
  > = courses.slice(0, 3).map((course) => ({ kind: 'course' as const, course }))

  let ghostIndex = 0
  while (slots.length < 3 && ghostIndex < GHOST_FILLERS.length) {
    slots.push({ kind: 'ghost', ghost: GHOST_FILLERS[ghostIndex] })
    ghostIndex += 1
  }

  return slots
}

interface HomePageClientProps {
  courses: Course[]
}

export default function HomePageClient({ courses }: HomePageClientProps) {
  const heroLeftRef = useRef<HTMLDivElement>(null)
  const heroCardRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let ctx: { revert: () => void } | undefined

    const loadGSAP = async () => {
      const { gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)

      ctx = gsap.context(() => {
      if (heroLeftRef.current) {
        gsap.from(heroLeftRef.current.children, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
        })
      }
      if (heroCardRef.current) {
        gsap.from(heroCardRef.current, {
          scale: 0.95,
          opacity: 0,
          duration: 0.8,
          delay: 0.3,
          ease: 'power3.out',
        })
        gsap.to(heroCardRef.current.querySelectorAll('.float-card'), {
          y: -8,
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.2,
        })
      }

      gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((section) => {
        gsap.from(section, {
          scrollTrigger: { trigger: section, start: 'top 85%' },
          y: 40,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
        })
      })

      if (statsRef.current) {
        gsap.from(statsRef.current.querySelectorAll('.stat-item'), {
          scrollTrigger: { trigger: statsRef.current, start: 'top 80%' },
          y: 24,
          opacity: 0,
          stagger: 0.1,
          duration: 0.6,
        })
      }
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

  const featuredSlots = buildFeaturedSlots(courses)

  return (
    <div>
      {/* Hero */}
      <section
        className={cn('reveal-section grid min-h-[520px] grid-cols-1 lg:grid-cols-[55%_45%]', publicSectionClass.white)}
      >
        <div ref={heroLeftRef} className="flex flex-col justify-center px-6 pb-8 pt-12 sm:px-8 lg:pl-10">
          <h1 className="hero-headline section-headline font-display text-[36px] font-bold leading-[1.15] text-[#1A1A2E] sm:text-[44px] sm:leading-[1.05] lg:text-[52px]">
            <span className="block">Build Skills</span>
            <span className="block">That Cannot Be</span>
            <span className="block text-primary">Automated.</span>
          </h1>
          <p className="mt-4 max-w-md font-body text-[15px] leading-relaxed text-[#5A5A7A] sm:text-base">
            Rev Multimedia trains the next generation of Ghanaian and African creatives
            in Graphic Design, Motion Graphics, and Video Editing &mdash; with the depth and
            discipline the industry actually demands.
          </p>
          <div className="mt-6 flex w-full max-w-[280px] flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap">
            <Link
              href="/apply"
              className={cn(
                buttonVariants({ variant: 'primary', size: 'md' }),
                'w-full justify-center px-5 py-3 text-sm sm:w-auto',
              )}
            >
              Apply for the Next Cohort
            </Link>
            <Link
              href="/courses"
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'md' }),
                'w-full justify-center px-5 py-3 text-sm sm:w-auto',
              )}
            >
              Explore Courses
            </Link>
          </div>
        </div>

        <div className="relative hidden items-center justify-center px-4 pb-10 pt-8 lg:flex lg:pr-8">
          <div ref={heroCardRef} className="relative w-full max-w-[420px]">
            <div
              className="relative h-[380px] overflow-hidden rounded-[28px] p-8 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #C74A86 0%, #9E3068 100%)' }}
            >
              <Image
                src="/images/african-creatives-in-class.jpg"
                alt=""
                fill
                className="object-cover opacity-25 mix-blend-luminosity"
              />
              <span className="relative z-10 inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">
                50% Off
              </span>
              <div className="relative z-10 mt-6">
                <h2 className="font-display text-[28px] font-semibold text-white">Graphic Design</h2>
                <p className="mt-1 text-sm text-white/80">Master the art of visual communication</p>
              </div>
              <div className="relative z-10 mt-8 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 w-8 overflow-hidden rounded-full border-2 border-white">
                      <Image src={`/members/person${i}.webp`} alt="" width={32} height={32} className="object-cover" />
                    </div>
                  ))}
                </div>
                <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-semibold text-white">
                  Applications Open
                </span>
              </div>
            </div>

            <div className="float-card absolute -right-2 -top-4 w-48 rounded-2xl bg-surface p-4 shadow-lg">
              <p className="text-[11px] uppercase text-gray-400">Next Intake</p>
              <p className="font-display text-xl font-semibold text-dark">Sept 2025</p>
            </div>
            <div className="float-card absolute -bottom-6 -left-6 w-52 rounded-2xl bg-surface p-4 shadow-lg">
              <p className="text-[11px] text-gray-400">Students Enrolled</p>
              <div className="mt-2 flex -space-x-2">
                {[4, 5, 6].map((i) => (
                  <div key={i} className="h-8 w-8 overflow-hidden rounded-full border-2 border-white">
                    <Image src={`/members/person${i}.webp`} alt="" width={32} height={32} className="object-cover" />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm font-medium text-dark">50+ trained</p>
            </div>

            <span className="absolute right-8 top-8 h-3 w-3 rounded-full bg-secondary/60" />
            <span className="absolute bottom-16 right-4 h-5 w-5 rounded-full bg-accent/40" />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section ref={statsRef} className={cn('reveal-section', publicSectionClass.muted)}>
        <div className="mx-auto max-w-5xl rounded-[20px] bg-surface-2 px-6 py-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { m: '3', l: 'Disciplines offered' },
            { m: '100%', l: 'Practical curriculum' },
            { m: '2', l: 'Delivery modes' },
            { m: '1', l: 'Shared mission' },
          ].map((s, i) => (
            <div
              key={s.l}
              className={cn(
                'stat-item text-center',
                i > 0 && 'md:border-l md:border-dark/[0.08]',
              )}
            >
              <p className="stat-number font-display text-4xl font-bold text-primary md:text-5xl">{s.m}</p>
              <p className="mt-1 font-body text-xs text-gray-400 md:text-sm">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 w-12 overflow-hidden rounded-full border-2 border-surface-2">
                <Image src={`/members/person${i}.webp`} alt="" width={48} height={48} className="object-cover" />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600">50+ students trained</p>
        </div>
        </div>
      </section>

      {/* Community */}
      <section
        className={cn(
          'reveal-section grid min-h-0 grid-cols-1 items-center gap-12 py-16 md:py-20 lg:grid-cols-[45%_55%]',
          publicSectionClass.white,
        )}
      >
        <div className="hidden justify-center lg:flex">
          <OrbitalAvatars />
        </div>
        <div className="w-full min-w-0 flex-1 px-4 md:px-8 lg:pl-8 lg:pr-12">
          <p className="section-label">Our Community</p>
          <h2 className="section-headline mt-3 font-display text-4xl font-bold text-[#1A1A2E]">
            Join a growing community of African creatives.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            From first-time learners to working professionals, Rev Multimedia brings together
            people committed to building real creative careers &mdash; not just collecting certificates.
          </p>
          <div
            className="mt-8 grid grid-cols-2"
            style={{ gap: '16px' }}
          >
            {[
              { m: '50+', l: 'Alumni trained' },
              { m: '3', l: 'Active disciplines' },
              { m: '2', l: 'Study modes' },
              { m: '1', l: 'Mission' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-gray-100 bg-surface-2 shadow-sm"
                style={{ padding: '20px 24px' }}
              >
                <p className="font-display text-3xl font-bold text-primary">{s.m}</p>
                <p className="mt-1 text-sm text-gray-600">{s.l}</p>
              </div>
            ))}
          </div>
          <Link href="/apply" className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'mt-6 inline-flex')}>
            Apply Now
          </Link>
        </div>
      </section>

      {/* Courses */}
      <section className={cn('reveal-section', publicSectionClass.white)}>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">Our Disciplines</p>
            <h2 className="section-headline mt-2 font-display text-4xl font-bold text-[#1A1A2E]">
              Three tracks. One goal.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-2 text-sm font-semibold text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              Applications Open
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredSlots.map((slot) => (
            <div
              key={slot.kind === 'course' ? slot.course.id : slot.ghost.title}
              className="min-w-0 w-full"
            >
              {slot.kind === 'course' ? (
                <CourseCard course={slot.course} className="h-full w-full" />
              ) : (
                <GhostCourseCard
                  title={slot.ghost.title}
                  accent={slot.ghost.accent}
                  icon={slot.ghost.icon}
                  imageSrc={slot.ghost.imageSrc}
                  className="h-full w-full"
                />
              )}
            </div>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href="/courses" className="text-[15px] font-medium text-primary hover:text-primary-hover">
            View All Courses &rarr;
          </Link>
        </p>
      </section>

      {/* Why Rev */}
      <section className={cn('reveal-section', publicSectionClass.muted)}>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="relative h-[250px] overflow-hidden rounded-2xl shadow-lg md:h-[400px]">
              <Image
                src="/images/students-working-together.jpg"
                alt="Students working together"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-4 rounded-2xl bg-surface p-4 shadow-lg">
              <p className="text-xs text-gray-600">Industry Ready</p>
              <div className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-primary to-primary-hover" />
              </div>
              <p className="mt-2 text-sm font-medium text-dark">85% employment rate</p>
            </div>
          </div>
          <div className="lg:pl-8">
            <p className="section-label">Why Rev Multimedia</p>
            <h2 className="section-headline mt-3 font-display text-4xl font-bold text-[#1A1A2E]">
              Training built for how the industry actually works.
            </h2>
            {[
              { t: 'Practitioner-led', b: 'primary', d: 'Learn from working creatives, not theorists.' },
              { t: 'Project-based', b: 'accent', d: 'Every module ends in portfolio-ready work.' },
              { t: 'Career-focused', b: 'secondary', d: 'Skills that stay valuable in the AI era.' },
            ].map((f) => (
              <div
                key={f.t}
                className={cn(
                  'mb-4 rounded-xl border-l-[3px] bg-white p-5 shadow-sm',
                  f.b === 'primary' && 'border-primary',
                  f.b === 'accent' && 'border-accent',
                  f.b === 'secondary' && 'border-secondary',
                )}
              >
                <p className="font-body text-base font-semibold text-[#1A1A2E]">{f.t}</p>
                <p className="mt-1 font-body text-[15px] leading-relaxed text-[#5A5A7A]">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={cn('reveal-section', publicSectionClass.white)}>
        <p className="section-label">Testimonials</p>
        <h2 className="section-headline mt-2 font-display text-4xl font-bold text-[#1A1A2E]">
          What our students say
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              name: 'Ama K.',
              course: 'Graphic Design',
              border: 'border-primary',
              quote: 'The structure changed how I approach client work.',
              avatar: '/alumni/pers5.jpg',
            },
            {
              name: 'Kwesi M.',
              course: 'Motion Graphics',
              border: 'border-secondary',
              quote: 'Real projects, real feedback. Exactly what I needed.',
              avatar: '/alumni/pers6.jpg',
            },
            {
              name: 'Efua T.',
              course: 'Video Editing',
              border: 'border-accent',
              quote: 'I finally feel confident charging professional rates.',
              avatar: '/alumni/pers7.jpg',
            },
          ].map((t) => (
            <article
              key={t.name}
              className={cn('rounded-2xl border-t-[3px] bg-surface p-6 shadow-card', t.border)}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={t.avatar}
                  alt="Alumni testimonial"
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-dark">{t.name}</p>
                  <p className="text-sm text-gray-600">{t.course}</p>
                </div>
              </div>
              <p className="mt-4 text-base leading-relaxed text-gray-600">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 inline-flex gap-0.5 text-sm text-yellow-400" aria-label="5 out of 5 stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} aria-hidden="true">
                    &#9733;
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section
        className={cn(
          'reveal-section relative overflow-hidden max-md:!px-6 max-md:!py-12',
          publicSectionClass.gradient,
        )}
        style={{ borderRadius: '0 0 32px 32px', textAlign: 'center' }}
      >
        <Image
          src="/images/graduated-student.jpg"
          alt=""
          fill
          className="object-cover opacity-[0.08]"
        />
        <div className="relative z-10" style={{ textAlign: 'center' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 className="section-headline font-display text-[32px] font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Your creative career starts with one decision.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/80 sm:text-lg">
            Applications are open for our upcoming cohorts. Spots are limited &mdash; we keep
            class sizes intentionally small so every student gets real attention.
          </p>
          <div className="mx-auto mt-10 flex w-full max-w-[280px] flex-col items-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
            <Link
              href="/apply"
              className={cn(
                buttonVariants({ variant: 'ghost-on-dark', size: 'md' }),
                'w-full justify-center border-2 border-white/50 px-5 py-3 text-sm sm:w-auto',
              )}
            >
              Apply Now &mdash; It Takes 10 Minutes
            </Link>
            <Link
              href="/contact"
              className="w-full text-center font-body text-sm text-white/80 underline hover:text-white sm:w-auto"
            >
              Have questions? Talk to us &rarr;
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/50">
            Application fee: GHS 100 &middot; Non-refundable &middot; Secures your place in the review process
          </p>
          </div>
        </div>
      </section>
    </div>
  )
}
