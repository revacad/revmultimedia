'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import type { RefObject } from 'react'
import { buttonVariants } from '@/components/ui/Button'
import { publicSectionClass } from '@/lib/public-ui'
import { cn } from '@/lib/utils'

const OrbitalAvatars = dynamic(
  () => import('@/components/public/OrbitalAvatars').then((m) => m.OrbitalAvatars),
  { ssr: false },
)

interface StatsSectionProps {
  statsRef: RefObject<HTMLElement | null>
}

export default function StatsSection({ statsRef }: StatsSectionProps) {
  return (
    <>
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
          <Link href="/apply/level-up" className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'mt-6 inline-flex')}>
            Apply Now
          </Link>
        </div>
      </section>
    </>
  )
}
