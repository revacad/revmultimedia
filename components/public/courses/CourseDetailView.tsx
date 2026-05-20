import Image from 'next/image'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import SanitizedHtml from '@/components/ui/SanitizedHtml'
import Button from '@/components/ui/Button'
import InternationalWelcomeNote from '@/components/public/InternationalWelcomeNote'
import ModeBadge from '@/components/public/ModeBadge'
import { formatCategory, formatMode } from '@/lib/courses/labels'
import { getCourseThumbnailSrc } from '@/lib/courses/thumbnail'
import {
  curriculumHtml,
  getVimeoId,
  getYouTubeId,
} from '@/lib/courses/curriculum'
import { getSlotIndicator } from '@/lib/courses/slots'
import type { Course } from '@/lib/courses/types'
import { publicSectionClass } from '@/lib/public-ui'
import { cn, formatDate, formatGHS } from '@/lib/utils'

interface CourseDetailViewProps {
  course: Course
}

function ModeCallout({ course }: { course: Course }) {
  if (course.mode === 'online') {
    return (
      <div className="rounded-xl border border-accent/25 bg-accent-light p-5">
        <p className="mb-2 font-semibold text-accent-hover">Fully online</p>
        <p className="text-sm leading-relaxed text-gray-600">
          Study from anywhere in the world. Live sessions and project reviews happen remotely
          &mdash; ideal for international students.
        </p>
      </div>
    )
  }

  if (course.mode === 'hybrid') {
    return (
      <div className="rounded-xl border border-secondary/25 bg-secondary-light p-5">
        <p className="mb-2 font-semibold text-secondary">Hybrid delivery</p>
        <p className="text-sm leading-relaxed text-gray-600">
          Combines online learning with in-person sessions in Accra. International students are
          welcome but must be able to travel for scheduled on-campus days.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-surface-2 p-5">
      <p className="mb-2 font-semibold text-dark">In-person in Accra</p>
      <p className="text-sm leading-relaxed text-gray-600">
        This programme requires physical attendance at our Accra campus. International applicants
        are welcome &mdash; our admissions team will discuss logistics during review.
      </p>
    </div>
  )
}

function IntroVideo({ url }: { url: string }) {
  const youtubeId = getYouTubeId(url)
  const vimeoId = getVimeoId(url)

  if (!youtubeId && !vimeoId) return null

  const embedSrc = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}`
    : `https://player.vimeo.com/video/${vimeoId}`

  return (
    <section className={publicSectionClass.white}>
      <h2
        className="mb-6 font-display text-[28px] font-semibold text-[#1A1A2E]"
        style={{ fontFamily: 'Clash Display, sans-serif' }}
      >
        Course intro
      </h2>
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ aspectRatio: '16 / 9', borderRadius: '16px' }}
      >
        <iframe
          src={embedSrc}
          title="Course intro video"
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  )
}

export default function CourseDetailView({ course }: CourseDetailViewProps) {
  const thumbnailSrc = getCourseThumbnailSrc(course)
  const slotIndicator = getSlotIndicator(course.intakes)

  const rawCurriculumHtml = curriculumHtml(course.curriculum)
  const descriptionIsHtml = Boolean(course.description?.includes('<'))

  return (
    <div>
      <div className="relative h-[45vh] min-h-[360px]">
        <Image src={thumbnailSrc} alt={course.title} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-dark/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 sm:px-12">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant={course.category}>{formatCategory(course.category)}</Badge>
            <ModeBadge mode={course.mode} />
          </div>
          <h1 className="max-w-3xl font-display text-4xl font-bold text-white md:text-5xl">
            {course.title}
          </h1>
        </div>
      </div>

      <div className={cn('grid grid-cols-1 gap-12 lg:grid-cols-3', publicSectionClass.white)}>
        <div className="space-y-10 lg:col-span-2">
          <InternationalWelcomeNote />

          {course.description && (
            <section>
              <h2 className="mb-4 font-display text-2xl font-semibold text-dark">About this course</h2>
              {descriptionIsHtml && course.description ? (
                <SanitizedHtml html={course.description} className="rich-content" />
              ) : (
                <p className="text-[17px] leading-relaxed text-gray-600">{course.description}</p>
              )}
            </section>
          )}

          <section>
            <h2 className="mb-4 font-display text-2xl font-semibold text-dark">Delivery mode</h2>
            <ModeCallout course={course} />
          </section>

          {course.intakes.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-2xl font-semibold text-dark">Upcoming intakes</h2>
              <ul className="space-y-3">
                {course.intakes.map((intake) => (
                  <li
                    key={intake.id}
                    className="rounded-xl border border-gray-100 bg-surface-2 px-5 py-4"
                  >
                    <p className="font-semibold text-dark">{intake.name}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatDate(intake.start_date)} &ndash; {formatDate(intake.end_date)}
                    </p>
                    {intake.application_deadline && (
                      <p className="mt-1 text-xs text-gray-400">
                        Apply by {formatDate(intake.application_deadline)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside>
          <div className="sticky top-24 rounded-2xl border border-gray-100 bg-surface p-6 shadow-card">
            <p className="mb-1 text-sm text-gray-600">Tuition fee</p>
            <p className="mb-4 font-display text-3xl font-bold text-primary">
              {formatGHS(course.tuition_fee_ghs)}
            </p>
            <p className="mb-1 text-sm text-gray-600">Format</p>
            <p className="mb-4 font-medium text-dark">{formatMode(course.mode)}</p>
            <div
              className={`mb-6 flex items-center gap-2 text-sm font-medium ${slotIndicator.colorClass}`}
            >
              <span className={`h-2 w-2 rounded-full ${slotIndicator.dotClass}`} />
              {slotIndicator.text}
            </div>
            <Link href={`/apply?course=${course.slug}`} className="block">
              <Button variant="primary" size="lg" className="w-full">
                Apply for this course
              </Button>
            </Link>
          </div>
        </aside>
      </div>

      <section style={{ padding: '48px' }}>
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
            fontSize: '16px',
            color: '#9898B8',
            marginBottom: '32px',
          }}
        >
          Full curriculum for {course.title}
        </p>
        {rawCurriculumHtml ? (
          <SanitizedHtml html={rawCurriculumHtml} className="rich-content" />
        ) : (
          <div
            className="text-center"
            style={{
              background: '#F7F8FC',
              border: '1.5px dashed #D8D8E8',
              borderRadius: '14px',
              padding: '32px',
            }}
          >
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#9898B8' }}>
              Curriculum details coming soon
            </p>
          </div>
        )}
      </section>

      {course.video_intro_url && <IntroVideo url={course.video_intro_url} />}
    </div>
  )
}
