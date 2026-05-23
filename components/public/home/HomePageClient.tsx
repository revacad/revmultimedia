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

export type NextIntakePreview = {
  id: string
  name: string
  start_date: string
  courses: { title: string } | null
}

interface HomePageClientProps {
  courses: Course[]
  nextIntake?: NextIntakePreview | null
}

export default function HomePageClient({ courses, nextIntake }: HomePageClientProps) {
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
  const firstFeaturedCourseId = featuredSlots.find(
    (slot): slot is { kind: 'course'; course: Course } => slot.kind === 'course',
  )?.course.id

  return (
    <div>
      {/* Hero */}
      <section
        className={cn(
          'reveal-section relative overflow-hidden grid min-h-[520px] grid-cols-1 lg:grid-cols-[55%_45%]',
          publicSectionClass.white,
        )}
      >
        {/* Floating design tool SVGs */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '12%',
              right: '3%',
              opacity: 0.08,
              animation: 'heroFloat1 9s ease-in-out infinite',
            }}
          >
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#C74A86" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
          <div
            style={{
              position: 'absolute',
              top: '45%',
              left: '1%',
              opacity: 0.07,
              animation: 'heroFloat2 11s ease-in-out infinite 1.5s',
            }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2DBFB8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '15%',
              right: '5%',
              opacity: 0.07,
              animation: 'heroFloat3 13s ease-in-out infinite 3s',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#F18F3B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
          </div>
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '2%',
              opacity: 0.06,
              animation: 'heroFloat1 15s ease-in-out infinite 2s',
            }}
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#C74A86" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
        </div>

        <div ref={heroLeftRef} className="relative z-[1] flex flex-col justify-center px-6 pb-8 pt-12 sm:px-8 lg:pl-10">
          <h1 className="hero-headline section-headline font-display text-[36px] font-bold leading-[1.15] text-[#1A1A2E] sm:text-[44px] sm:leading-[1.05] lg:text-[52px]">
            <span className="block">Build Skills</span>
            <span className="block">That Cannot Be</span>
            <span className="block text-primary">Automated.</span>
          </h1>
          <p className="mt-4 max-w-md font-body text-[15px] leading-relaxed text-[#5A5A7A] sm:text-base">
            Rev Multimedia trains the next generation of Ghanaian and African creatives
            in Graphic Design, Motion Graphics, and Video Editing, with the depth and
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

        <div className="relative z-[1] hidden items-center justify-center px-4 pb-10 pt-8 lg:flex lg:pr-8">
          <div ref={heroCardRef} className="relative w-full max-w-[420px]">
            <div
              className="relative h-[380px] overflow-hidden rounded-[28px] p-8 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #C74A86 0%, #9E3068 100%)' }}
            >
              <Image
                src="/images/african-creatives-in-class.jpg"
                alt="African creatives in class at Rev Multimedia, Accra Ghana"
                fill
                priority
                loading="eager"
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
                className="opacity-25 mix-blend-luminosity"
              />
              {nextIntake && (
                <div
                  className="absolute z-20"
                  style={{
                    top: '16px',
                    right: '16px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '9px',
                      color: '#9898B8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '2px',
                    }}
                  >
                    Next Intake
                  </p>
                  <p
                    style={{
                      fontFamily: 'Clash Display, sans-serif',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#1A1A2E',
                      lineHeight: 1,
                      marginBottom: '2px',
                    }}
                  >
                    {new Date(nextIntake.start_date).toLocaleDateString('en-GB', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  {nextIntake.courses?.title && (
                    <p
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '9px',
                        color: '#C74A86',
                        marginTop: '2px',
                      }}
                    >
                      {nextIntake.courses.title}
                    </p>
                  )}
                </div>
              )}
              <div
                className="relative z-10"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    fontFamily: 'Clash Display, sans-serif',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#C74A86',
                  }}
                >
                  50% Off
                </div>
                <span
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.6)',
                    marginTop: '3px',
                    paddingLeft: '4px',
                  }}
                >
                  T&amp;C apply
                </span>
              </div>
              <div className="relative z-10 mt-6">
                <h2 className="font-display text-[28px] font-semibold text-white">Graphic Design</h2>
                <p className="mt-1 text-sm text-white/80">Master the art of visual communication</p>
              </div>
              <div className="relative z-10 mt-8 flex items-center gap-2">
                <div className="flex items-center">
                  {['/alumni/pers1.jpg', '/alumni/pers2.jpg', '/alumni/pers3.jpg'].map((src, i) => (
                    <div
                      key={src}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid white',
                        marginLeft: i === 0 ? 0 : -8,
                        position: 'relative',
                        zIndex: 2 - i,
                      }}
                    >
                      <Image
                        src={src}
                        alt="Graphic design student at Rev Multimedia, Accra Ghana"
                        width={28}
                        height={28}
                        sizes="28px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-semibold text-white">
                  Applications Open
                </span>
              </div>
            </div>
            <div className="float-card absolute -bottom-6 -left-6 w-52 rounded-2xl bg-surface p-4 shadow-lg">
              <p className="text-[11px] text-gray-400">Students Enrolled</p>
              <div className="mt-2 flex -space-x-2">
                {['/alumni/pers1.jpg', '/alumni/pers2.jpg', '/alumni/pers3.jpg', '/alumni/pers4.jpg', '/alumni/pers5.jpg'].map((src) => (
                  <div key={src} className="h-8 w-8 overflow-hidden rounded-full border-2 border-white">
                    <Image src={src} alt="Rev Multimedia alumni trained in Accra Ghana" width={32} height={32} sizes="32px" className="object-cover" />
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
        <div
          className="flex flex-col gap-6 md:flex-row md:items-stretch"
          style={{ display: 'flex' }}
        >
          {[
            { value: '3', label: 'Disciplines offered' },
            { value: '100%', label: 'Practical curriculum' },
            { value: '2', label: 'Delivery modes' },
            { value: '1', label: 'Shared mission' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={cn('stat-item flex-1', i > 0 && 'md:border-l md:border-dark/[0.08]')}
              style={{
                textAlign: 'center',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontFamily: 'Clash Display, sans-serif',
                  fontSize: '40px',
                  fontWeight: 700,
                  color: '#C74A86',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#9898B8',
                  marginTop: '6px',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center">
            {['pers1.jpg', 'pers2.jpg', 'pers3.jpg', 'pers4.jpg', 'pers5.jpg'].map((img, i) => (
              <div
                key={img}
                className="relative overflow-hidden rounded-full border-2 border-surface-2"
                style={{
                  width: 32,
                  height: 32,
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: 5 - i,
                }}
              >
                <Image
                  src={`/alumni/${img}`}
                  alt="Rev Multimedia alumni trained in Accra Ghana"
                  width={32}
                  height={32}
                  sizes="32px"
                  className="object-cover"
                />
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
            people committed to building real creative careers, not just collecting certificates.
          </p>
          <div
            className="mt-8"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            {[
              {
                value: '50+',
                label: 'Alumni trained',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C74A86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
              },
              {
                value: '3',
                label: 'Active disciplines',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C74A86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                ),
              },
              {
                value: '2',
                label: 'Study modes',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C74A86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                ),
              },
              {
                value: '1',
                label: 'Mission',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C74A86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                ),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  border: '1px solid #EFEFF5',
                  boxShadow: '0 2px 8px rgba(26,26,46,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Clash Display, sans-serif',
                      fontSize: '32px',
                      fontWeight: 700,
                      color: '#C74A86',
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </span>
                  <div style={{ opacity: 0.85, flexShrink: 0 }}>{stat.icon}</div>
                </div>
                <div
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: '#9898B8',
                  }}
                >
                  {stat.label}
                </div>
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
                <CourseCard
                  course={slot.course}
                  className="h-full w-full"
                  priority={slot.course.id === firstFeaturedCourseId}
                />
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
                alt="Students learning graphic design at Rev Multimedia, Accra Ghana"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                style={{ objectFit: 'cover' }}
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
              {
                title: 'Practitioner-led',
                body: 'Learn from working creatives, not theorists.',
                color: '#C74A86',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C74A86" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                ),
              },
              {
                title: 'Project-based',
                body: 'Every module ends in portfolio-ready work.',
                color: '#2DBFB8',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2DBFB8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                ),
              },
              {
                title: 'Career-focused',
                body: 'Skills that stay valuable in the AI era.',
                color: '#F18F3B',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F18F3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #EFEFF5',
                  borderLeft: `3px solid ${feature.color}`,
                  boxShadow: '0 2px 8px rgba(26,26,46,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  marginBottom: '12px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: 'Clash Display, sans-serif',
                      fontSize: '17px',
                      fontWeight: 600,
                      color: '#1A1A2E',
                      marginBottom: '6px',
                    }}
                  >
                    {feature.title}
                  </p>
                  <p
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      color: '#5A5A7A',
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.body}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>{feature.icon}</div>
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
                  alt={`${t.name}, ${t.course} student testimonial at Rev Multimedia Ghana`}
                  width={40}
                  height={40}
                  sizes="40px"
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
        className="reveal-section"
        style={{
          background: 'linear-gradient(135deg, #1A1A2E 0%, #2F2F52 100%)',
          padding: '80px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(199,74,134,0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontFamily: 'Clash Display, sans-serif',
              fontSize: '48px',
              fontWeight: 700,
              color: 'white',
              marginBottom: '16px',
              lineHeight: 1.15,
            }}
          >
            Your creative career starts
            <br />
            with one decision.
          </h2>
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '16px',
              color: 'rgba(255,255,255,0.65)',
              marginBottom: '40px',
              maxWidth: '520px',
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
          >
            Applications are open for our upcoming cohorts. Spots are limited: we keep class
            sizes small intentionally, so every student gets the attention they deserve.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '40px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '9999px',
                padding: '10px 24px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Application fee: GHS 100 per application
            </div>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '9999px',
                padding: '10px 24px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Career-focused · Skills that last
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/apply"
              style={{
                backgroundColor: 'white',
                color: '#1A1A2E',
                padding: '16px 40px',
                borderRadius: '9999px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-block',
                boxShadow: '0 4px 24px rgba(0,0,0,0.20)',
              }}
            >
              Apply Now, Join the Next Cohort
            </Link>
            <Link
              href="/courses"
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '9999px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
                border: '1.5px solid rgba(255,255,255,0.30)',
              }}
            >
              View our courses →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
