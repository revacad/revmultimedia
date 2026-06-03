'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { RefObject } from 'react'
import { buttonVariants } from '@/components/ui/Button'
import PromoSection from '@/components/public/home/PromoSection'
import type { NextIntakePreview } from '@/lib/home/featured-slots'
import { publicSectionClass } from '@/lib/public-ui'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  nextIntake?: NextIntakePreview | null
  heroLeftRef: RefObject<HTMLDivElement | null>
  heroCardRef: RefObject<HTMLDivElement | null>
  onOpenPromoTerms: () => void
}

export default function HeroSection({
  nextIntake,
  heroLeftRef,
  heroCardRef,
  onOpenPromoTerms,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden grid min-h-[520px] grid-cols-1 lg:grid-cols-[55%_45%]',
        publicSectionClass.white,
      )}
    >
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

      <div
        ref={heroLeftRef}
        className="relative z-[1] flex flex-col justify-center px-6 pb-8 pt-12 sm:px-8 lg:pl-10"
      >
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
        {nextIntake && (
          <div className="mt-6 w-full max-w-sm rounded-xl border border-[#EFEFF5] bg-white p-4 shadow-card sm:hidden">
            <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-[#9898B8]">
              Next Intake
            </p>
            <p className="mt-1 font-display text-lg font-bold text-[#1A1A2E]">
              {new Date(nextIntake.start_date).toLocaleDateString('en-GB', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
            {nextIntake.courses?.title && (
              <p className="mt-1 font-body text-xs text-[#C74A86]">{nextIntake.courses.title}</p>
            )}
          </div>
        )}
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
              <div className="absolute right-4 top-4 z-20 hidden max-w-[140px] rounded-xl bg-white px-3.5 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.15)] lg:block">
                <p className="mb-0.5 font-body text-[9px] uppercase tracking-wider text-[#9898B8]">
                  Next Intake
                </p>
                <p className="font-display text-base font-bold leading-none text-[#1A1A2E]">
                  {new Date(nextIntake.start_date).toLocaleDateString('en-GB', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                {nextIntake.courses?.title && (
                  <p className="mt-0.5 font-body text-[9px] text-[#C74A86]">
                    {nextIntake.courses.title}
                  </p>
                )}
              </div>
            )}
            <PromoSection onOpenTerms={onOpenPromoTerms} />
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
  )
}
