'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createCampaign } from '@/actions/communications'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { formatPaymentDateTime } from '@/lib/payments/format'
import type { CampaignFilters, CommunicationChannel } from '@/lib/messaging/types'

export type CampaignListRow = {
  id: string
  channel: CommunicationChannel
  subject: string | null
  message: string
  recipient_count: number
  sent_count: number
  failed_count: number
  status: string
  created_at: string
  admins: { full_name: string } | null
}

type CourseOption = { id: string; title: string }
type IntakeOption = { id: string; name: string; course_id: string }

interface CommunicationsPageClientProps {
  campaigns: CampaignListRow[]
  courses: CourseOption[]
  intakes: IntakeOption[]
}

const CHANNEL_CLASS: Record<string, string> = {
  email: 'bg-[#EBF0FD] text-[#4A7BE8]',
  sms: 'bg-[#FEF6EE] text-[#C4701E]',
  whatsapp: 'bg-[#EBF9F8] text-[#1E9990]',
}

export default function CommunicationsPageClient({
  campaigns,
  courses,
  intakes,
}: CommunicationsPageClientProps) {
  const router = useRouter()
  const [channel, setChannel] = useState<CommunicationChannel>('sms')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<'all' | 'course' | 'intake'>('all')
  const [courseId, setCourseId] = useState('')
  const [intakeId, setIntakeId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const filteredIntakes = courseId
    ? intakes.filter((i) => i.course_id === courseId)
    : intakes

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const filters: CampaignFilters = { recipientType: audience }
    if (audience === 'course') {
      if (!courseId) {
        setError('Select a course')
        return
      }
      filters.courseId = courseId
    }
    if (audience === 'intake') {
      if (!intakeId) {
        setError('Select an intake')
        return
      }
      filters.intakeId = intakeId
    }

    startTransition(async () => {
      const result = await createCampaign({
        channel,
        subject: channel === 'email' ? subject : undefined,
        message,
        filters,
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      setMessage('')
      setSubject('')
      setSuccess('Campaign queued successfully')
      router.push(`/admin/communications/${result.campaignId}`)
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Communications</h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          Send bulk email, SMS, or WhatsApp messages to students
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">New campaign</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <AdminLabel>Channel</AdminLabel>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as CommunicationChannel)}
                className={adminFieldClassName}
              >
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>

            {channel === 'email' && (
              <div>
                <AdminLabel htmlFor="subject">Subject</AdminLabel>
                <input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={adminFieldClassName}
                  placeholder="Message subject"
                />
              </div>
            )}

            <div>
              <AdminLabel htmlFor="message">Message</AdminLabel>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className={adminFieldClassName}
                placeholder="Your message to students…"
              />
            </div>

            <div>
              <AdminLabel>Audience</AdminLabel>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as typeof audience)}
                className={adminFieldClassName}
              >
                <option value="all">All active students</option>
                <option value="course">By course</option>
                <option value="intake">By intake</option>
              </select>
            </div>

            {audience === 'course' && (
              <div>
                <AdminLabel>Course</AdminLabel>
                <select
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value)
                    setIntakeId('')
                  }}
                  className={adminFieldClassName}
                >
                  <option value="">Select course…</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {audience === 'intake' && (
              <div>
                <AdminLabel>Intake</AdminLabel>
                <select
                  value={intakeId}
                  onChange={(e) => setIntakeId(e.target.value)}
                  className={adminFieldClassName}
                >
                  <option value="">Select intake…</option>
                  {filteredIntakes.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <p className="font-body text-sm text-[#E84A4A]">{error}</p>
            )}
            {success && (
              <p className="font-body text-sm text-[#1E9990]">{success}</p>
            )}

            <button
              type="submit"
              disabled={pending || !message.trim()}
              className="rounded-full bg-primary px-6 py-2.5 font-body text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? 'Sending…' : 'Send campaign'}
            </button>
          </form>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
            Recent campaigns
          </h2>
          {campaigns.length === 0 ? (
            <p className="font-body text-sm text-[#9898B8]">No campaigns yet.</p>
          ) : (
            <ul className="divide-y divide-[#EFEFF5]">
              {campaigns.map((row) => (
                <li key={row.id} className="py-3">
                  <Link
                    href={`/admin/communications/${row.id}`}
                    className="flex items-start justify-between gap-3 hover:opacity-80"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-body text-xs font-semibold capitalize ${
                            CHANNEL_CLASS[row.channel] ?? 'bg-[#F0F0F8] text-[#5A5A7A]'
                          }`}
                        >
                          {row.channel}
                        </span>
                        <span className="font-body text-xs capitalize text-[#9898B8]">
                          {row.status}
                        </span>
                      </div>
                      <p className="line-clamp-1 font-body text-sm text-[#1A1A2E]">
                        {row.subject || row.message}
                      </p>
                      <p className="font-body text-xs text-[#9898B8]">
                        {row.sent_count}/{row.recipient_count} sent
                        {row.failed_count > 0 ? ` · ${row.failed_count} failed` : ''}
                        {row.admins?.full_name ? ` · ${row.admins.full_name}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 font-body text-xs text-[#9898B8]">
                      {formatPaymentDateTime(row.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
