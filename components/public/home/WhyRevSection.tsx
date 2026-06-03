import Image from 'next/image'
import { publicSectionClass } from '@/lib/public-ui'
import { cn } from '@/lib/utils'

export default function WhyRevSection() {
  return (
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
  )
}
