'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { addAdminNote } from '@/actions/application'
import type { ApplicationAdminNote } from '@/lib/applications/types'

const formatNoteDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

interface AdminNotesSectionProps {
  applicationId: string
  notes: ApplicationAdminNote[]
}

export default function AdminNotesSection({
  applicationId,
  notes,
}: AdminNotesSectionProps) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await addAdminNote(applicationId, note)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setNote('')
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Internal Notes</h2>
      <p className="mb-4 font-body text-xs text-[#9898B8]">Not visible to the applicant</p>

      {notes.length > 0 ? (
        <ul className="mb-4 space-y-3">
          {notes.map((entry) => (
            <li key={entry.id} className="rounded-lg bg-[#F7F8FC] p-3">
              <p className="font-body text-sm text-[#1A1A2E]">{entry.note}</p>
              <p className="mt-1 font-body text-xs text-[#9898B8]">
                {entry.admins?.full_name ?? 'Admin'} ·{' '}
                {formatNoteDate(entry.created_at)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 font-body text-sm text-[#9898B8]">No notes yet.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add an internal note for your team…"
          className="w-full resize-y rounded-[10px] border-[1.5px] border-[#D8D8E8] bg-white px-4 py-3 font-body text-[15px] text-[#1A1A2E] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
        />
        <Button type="submit" variant="primary" size="sm" disabled={pending || !note.trim()}>
          {pending ? 'Saving…' : 'Add Note'}
        </Button>
      </form>
    </div>
  )
}
