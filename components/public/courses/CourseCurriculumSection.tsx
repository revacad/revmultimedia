'use client'

import Link from 'next/link'
import SanitizedHtml from '@/components/ui/SanitizedHtml'

interface CourseCurriculumSectionProps {
  courseTitle: string
  courseSlug: string
  html: string
  toc: string[]
}

export function CourseCurriculumSection({
  courseTitle,
  courseSlug,
  html,
  toc,
}: CourseCurriculumSectionProps) {
  if (!html) {
    return (
      <section className="pb-16">
        <div className="mx-auto max-w-[1200px] px-6 md:px-12">
          <h2
            className="mb-2 font-display text-[28px] text-[#1A1A2E]"
            style={{ fontFamily: 'Clash Display, sans-serif' }}
          >
            What you will learn
          </h2>
          <div
            className="mt-8 rounded-[14px] border border-dashed border-[#D8D8E8] bg-[#F7F8FC] px-8 py-8 text-center"
          >
            <p className="font-body text-[15px] text-[#9898B8]">Curriculum details coming soon</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="pb-16">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-8 px-6 md:grid-cols-[260px_1fr] md:gap-12 md:px-12">
        <aside
          className="hidden md:block"
          style={{
            position: 'sticky',
            top: '24px',
            backgroundColor: '#F7F8FC',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #EFEFF5',
          }}
        >
          {toc.length > 0 && (
            <>
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9898B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '16px',
                }}
              >
                In this course
              </p>
              <nav>
                {toc.map((item, i) => (
                  <a
                    key={`${item}-${i}`}
                    href={`#section-${i}`}
                    className="curriculum-toc-link"
                    style={{
                      display: 'block',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      color: '#5A5A7A',
                      padding: '6px 0',
                      borderBottom: '1px solid #EFEFF5',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </>
          )}
          <Link
            href={`/apply?course=${courseSlug}`}
            style={{
              display: 'block',
              marginTop: '20px',
              backgroundColor: '#C74A86',
              color: 'white',
              borderRadius: '9999px',
              padding: '10px 16px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Apply Now
          </Link>
        </aside>

        <div className="min-w-0 md:max-h-[70vh] md:overflow-y-auto md:pr-4">
          <h2
            style={{
              fontFamily: 'Clash Display, sans-serif',
              fontSize: '28px',
              color: '#1A1A2E',
              marginBottom: '8px',
            }}
          >
            What you will learn
          </h2>
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              color: '#9898B8',
              marginBottom: '32px',
            }}
          >
            Full curriculum for {courseTitle}
          </p>
          <SanitizedHtml html={html} className="rich-content" />
        </div>
      </div>
    </section>
  )
}
