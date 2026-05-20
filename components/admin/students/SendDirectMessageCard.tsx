'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendDirectMessage } from '@/actions/communications'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import type { CommunicationChannel } from '@/lib/messaging/types'

export default function SendDirectMessageCard({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [channel, setChannel] = useState<CommunicationChannel>('sms')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await sendDirectMessage({
        studentId,
        channel,
        subject: channel === 'email' ? subject : undefined,
        message,
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      setMessage('')
      setSubject('')
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
      <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
        Send message
      </h2>
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
            <AdminLabel htmlFor="dm-subject">Subject</AdminLabel>
            <input
              id="dm-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={adminFieldClassName}
            />
          </div>
        )}
        <div>
          <AdminLabel htmlFor="dm-message">Message</AdminLabel>
          <textarea
            id="dm-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className={adminFieldClassName}
          />
        </div>
        {error && <p className="font-body text-sm text-[#E84A4A]">{error}</p>}
        {success && (
          <p className="font-body text-sm text-[#1E9990]">Message sent</p>
        )}
        <button
          type="submit"
          disabled={pending || !message.trim()}
          className="rounded-full bg-primary px-5 py-2 font-body text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </section>
  )
}
