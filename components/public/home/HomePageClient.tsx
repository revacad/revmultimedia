'use client'

import { useEffect, useRef } from 'react'
import { publicSectionClass } from '@/lib/public-ui'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { buttonVariants } from '@/components/ui/Button'
import CourseCard from '@/components/public/CourseCard'
import ScatteredAvatars from '@/components/public/ScatteredAvatars'
import GhostCourseCard from '@/components/public/home/GhostCourseCard'
import { PREVIEW_GRAPHIC_DESIGN_COURSE } from '@/lib/courses/preview'
import type { Course } from '@/lib/courses/types'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

interface HomePageClientProps {
  courses: Course[]
}

export default function HomePageClient({ courses }: HomePageClientProps) {
  const heroLeftRef = useRef<HTMLDivElement>(null)
  const heroCardRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
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

    return () => ctx.revert()
  }, [])

  const graphicCourse =
    courses.find((c) => c.category === 'graphic_design') ??
    PREVIEW_GRAPHIC_DESIGN_COURSE

  return (
    <div>
      {/* Hero */}
      <section
        className={cn('reveal-section grid min-h-[520px] grid-cols-1 lg:grid-cols-[55%_45%]', publicSectionClass.white)}
      >
        <div ref={heroLeftRef} className="flex flex-col justify-center px-6 pb-8 pt-12 sm:px-8 lg:pl-10">
          <span className="inline-flex w-fit items-center rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            Creative Education for the AI Era
          </span>
          <h1 className="mt-4 font-display text-[44px] font-bold leading-[1.05] text-dark sm:text-[52px]">
            <span className="block">Build Skills</span>
            <span className="block">That Cannot Be</span>
            <span className="block text-primary">Automated.</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-brand-gray-600">
            Rev Multimedia Academy trains the next generation of Ghanaian and African creatives
            in Graphic Design, Motion Graphics, and Video Editing &mdash; with the depth and
            discipline the industry actually demands.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/apply" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
              Apply for the Next Cohort
            </Link>
            <Link href="/courses" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
              Explore Courses
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 sm:gap-8">
            {[
              { n: '500+', l: 'Students' },
              { n: '3', l: 'Disciplines' },
              { n: '2', l: 'Modes' },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-lg font-bold text-primary">{s.n}</p>
                <p className="text-xs text-brand-gray-400">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center px-4 pb-10 pt-8 lg:pr-8">
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
              <p className="text-[11px] uppercase text-brand-gray-400">Next Intake</p>
              <p className="font-display text-xl font-semibold text-dark">Sept 2025</p>
            </div>
            <div className="float-card absolute -bottom-6 -left-6 w-52 rounded-2xl bg-surface p-4 shadow-lg">
              <p className="text-[11px] text-brand-gray-400">Students Enrolled</p>
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
              <p className="font-display text-5xl font-bold text-primary">{s.m}</p>
              <p className="mt-1 text-sm text-brand-gray-400">{s.l}</p>
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
          <p className="text-sm text-brand-gray-600">50+ students trained</p>
        </div>
        </div>
      </section>

      {/* Community */}
      <section
        className={cn('reveal-section grid grid-cols-1 items-center gap-12 lg:grid-cols-2', publicSectionClass.white)}
      >
        <ScatteredAvatars />
        <div className="lg:pl-8">
          <p className="section-label">Our Community</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-dark">
            Join a growing community of African creatives.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-gray-600">
            From first-time learners to working professionals, Rev Multimedia brings together
            people committed to building real creative careers &mdash; not just collecting certificates.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { m: '50+', l: 'Alumni trained' },
              { m: '3', l: 'Active disciplines' },
              { m: '2', l: 'Study modes' },
              { m: '1', l: 'Mission' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-brand-gray-100 bg-surface-2 p-5 shadow-sm"
              >
                <p className="font-display text-3xl font-bold text-primary">{s.m}</p>
                <p className="mt-1 text-sm text-brand-gray-500">{s.l}</p>
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
            <h2 className="mt-2 font-display text-4xl font-bold text-dark">Three tracks. One goal.</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-2 text-sm font-semibold text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              Applications Open
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="min-w-0 w-full">
            <CourseCard course={graphicCourse} className="h-full w-full" />
          </div>
          <div className="min-w-0 w-full">
            <GhostCourseCard title="Motion Graphics" accent="secondary" icon="play" className="h-full w-full" />
          </div>
          <div className="min-w-0 w-full">
            <GhostCourseCard title="Video Editing" accent="accent" icon="cut" className="h-full w-full" />
          </div>
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
            <div className="relative h-[400px] overflow-hidden rounded-2xl shadow-lg">
              <Image
                src="/images/students-working-together.jpg"
                alt="Students working together"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-4 rounded-2xl bg-surface p-4 shadow-lg">
              <p className="text-xs text-brand-gray-500">Industry Ready</p>
              <div className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-brand-gray-100">
                <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-primary to-primary-hover" />
              </div>
              <p className="mt-2 text-sm font-medium text-dark">85% employment rate</p>
            </div>
          </div>
          <div className="lg:pl-8">
            <p className="section-label">Why Rev Multimedia</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-dark">
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
                  'mb-4 rounded-xl border-l-[3px] bg-surface p-5 shadow-sm',
                  f.b === 'primary' && 'border-primary',
                  f.b === 'accent' && 'border-accent',
                  f.b === 'secondary' && 'border-secondary',
                )}
              >
                <p className="font-semibold text-dark">{f.t}</p>
                <p className="mt-1 text-sm text-brand-gray-600">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={cn('reveal-section', publicSectionClass.white)}>
        <p className="section-label">Testimonials</p>
        <h2 className="mt-2 font-display text-4xl font-bold text-dark">What our students say</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { name: 'Ama K.', course: 'Graphic Design', border: 'border-primary', quote: 'The structure changed how I approach client work.' },
            { name: 'Kwesi M.', course: 'Motion Graphics', border: 'border-secondary', quote: 'Real projects, real feedback. Exactly what I needed.' },
            { name: 'Efua T.', course: 'Video Editing', border: 'border-accent', quote: 'I finally feel confident charging professional rates.' },
          ].map((t) => (
            <article
              key={t.name}
              className={cn('rounded-2xl border-t-[3px] bg-surface p-6 shadow-card', t.border)}
            >
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-light to-accent-light" />
                <div>
                  <p className="font-semibold text-dark">{t.name}</p>
                  <p className="text-sm text-brand-gray-500">{t.course}</p>
                </div>
              </div>
              <p className="mt-4 text-base leading-relaxed text-brand-gray-600">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 flex gap-0.5 text-secondary">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section
        className={cn('reveal-section relative overflow-hidden', publicSectionClass.gradient)}
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
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Your creative career starts with one decision.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/80">
            Applications are open for our upcoming cohorts. Spots are limited &mdash; we keep
            class sizes intentionally small so every student gets real attention.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/apply"
              className={cn(
                buttonVariants({ variant: 'ghost-on-dark', size: 'xl' }),
                'border-2 border-white/50',
              )}
            >
              Apply Now &mdash; It Takes 10 Minutes
            </Link>
            <Link href="/contact" className="text-white/80 underline hover:text-white">
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
