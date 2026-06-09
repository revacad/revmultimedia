'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import data from '@emoji-mart/data'
import { sendDirectMessage } from '@/actions/communications'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import type { CommunicationChannel } from '@/lib/messaging/types'

const EmojiPicker = dynamic(() => import('@emoji-mart/react'), { ssr: false })

export default function SendDirectMessageCard({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [channel, setChannel] = useState<CommunicationChannel>('sms')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()
  const [pickerOpen, setPickerOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pickerContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pickerOpen) return
    function handleMouseDown(event: MouseEvent) {
      if (
        pickerContainerRef.current &&
        !pickerContainerRef.current.contains(event.target as Node)
      ) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [pickerOpen])

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = message.slice(0, start) + emoji + message.slice(end)
    setMessage(newValue)
    setTimeout(() => {
      textarea.selectionStart = start + emoji.length
      textarea.selectionEnd = start + emoji.length
      textarea.focus()
    }, 0)
  }

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
          <div ref={pickerContainerRef} className="relative">
            <textarea
              id="dm-message"
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className={adminFieldClassName}
            />
            <button
              type="button"
              aria-label="Insert emoji"
              onClick={() => setPickerOpen((open) => !open)}
              className="absolute bottom-2 right-2 text-[#9898B8] transition-colors hover:text-[#5A5A7A]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>
            {pickerOpen && (
              <div className="absolute bottom-full right-0 z-20 mb-2">
                <EmojiPicker
                  data={data}
                  set="native"
                  onEmojiSelect={(emoji: { native?: string }) => {
                    if (emoji.native) insertEmoji(emoji.native)
                    setPickerOpen(false)
                  }}
                />
              </div>
            )}
          </div>
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
