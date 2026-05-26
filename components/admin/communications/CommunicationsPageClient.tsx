'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createCampaign } from '@/actions/communications'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import EmailComposer from '@/components/admin/communications/EmailComposer'
import WhatsAppComposer from '@/components/admin/communications/WhatsAppComposer'
import { formatPaymentDateTime } from '@/lib/payments/format'
import { StateWrapper } from '@/components/ui/StateWrapper'
import type { AudienceFilter, CampaignFilters, CommunicationChannel } from '@/lib/messaging/types'

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

interface CommunicationsPageClientProps {
  campaigns: CampaignListRow[]
  courses: CourseOption[]
}

const CHANNEL_CLASS: Record<string, string> = {
  email: 'bg-[#EBF0FD] text-[#4A7BE8]',
  sms: 'bg-[#FEF6EE] text-[#C4701E]',
  whatsapp: 'bg-[#EBF9F8] text-[#1E9990]',
}

export default function CommunicationsPageClient({
  campaigns,
  courses,
}: CommunicationsPageClientProps) {
  const router = useRouter()
  const [channel, setChannel] = useState<CommunicationChannel>('sms')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<AudienceFilter>('all_students')
  const [courseId, setCourseId] = useState('')
  const [country, setCountry] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function buildFilters(): CampaignFilters | { error: string } {
    const filters: CampaignFilters = { audience }

    if (audience === 'students_by_course') {
      if (!courseId) return { error: 'Select a course' }
      filters.courseId = courseId
    }
    if (audience === 'students_by_country') {
      if (!country.trim()) return { error: 'Enter a country' }
      filters.country = country.trim()
    }

    return filters
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const built = buildFilters()
    if ('error' in built) {
      setError(built.error)
      return
    }

    startTransition(async () => {
      const result = await createCampaign({
        channel,
        subject: channel === 'email' ? subject : undefined,
        message,
        filters: built,
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
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Communications</h1>
          <p className="mt-1 font-body text-sm text-[#9898B8]">
            Send bulk email, SMS, or WhatsApp to students and applicants
          </p>
        </div>
        <Link
          href="/admin/communications/logs"
          className="font-body text-sm font-semibold text-primary hover:underline"
        >
          View message log
        </Link>
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
              {channel === 'email' ? (
                <EmailComposer value={message} onChange={setMessage} />
              ) : channel === 'whatsapp' ? (
                <WhatsAppComposer value={message} onChange={setMessage} />
              ) : (
                <>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 160))}
                    required
                    rows={5}
                    maxLength={160}
                    className={adminFieldClassName}
                    placeholder="SMS message (160 characters max)…"
                  />
                  <p className="mt-1 text-right font-body text-xs text-[#9898B8]">
                    {message.length}/160
                  </p>
                </>
              )}
            </div>

            <div>
              <AdminLabel htmlFor="audience">Audience</AdminLabel>
              <select
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value as AudienceFilter)}
                className={adminFieldClassName}
              >
                <optgroup label="Students">
                  <option value="all_students">All active students</option>
                  <option value="students_by_course">Students by course</option>
                  <option value="students_by_country">Students by country</option>
                  <option value="students_paid_tuition">Students — tuition paid</option>
                  <option value="students_unpaid_tuition">Students — tuition unpaid</option>
                  <option value="students_partial_tuition">Students — partial tuition</option>
                  <option value="students_completed">Completed students</option>
                </optgroup>
                <optgroup label="Applicants">
                  <option value="all_applicants">All applicants</option>
                  <option value="applicants_pending">Pending applicants</option>
                  <option value="applicants_shortlisted">Shortlisted</option>
                  <option value="applicants_accepted">Accepted (awaiting payment)</option>
                  <option value="applicants_rejected">Rejected</option>
                  <option value="applicants_deferred">Deferred</option>
                  <option value="applicants_app_fee_unpaid">App fee unpaid</option>
                  <option value="applicants_app_fee_paid">App fee paid</option>
                </optgroup>
                <optgroup label="Everyone">
                  <option value="all">All (students + applicants)</option>
                </optgroup>
              </select>
            </div>

            {audience === 'students_by_course' && (
              <div>
                <AdminLabel>Course</AdminLabel>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
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

            {audience === 'students_by_country' && (
              <div>
                <AdminLabel htmlFor="country">Country</AdminLabel>
                <input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={adminFieldClassName}
                  placeholder="e.g. Ghana"
                />
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
          <StateWrapper
            loading={false}
            empty={campaigns.length === 0}
            emptyTitle="No campaigns yet"
            emptyMessage="Bulk messages you send will appear here."
          >
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
          </StateWrapper>
        </section>
      </div>
    </div>
  )
}
