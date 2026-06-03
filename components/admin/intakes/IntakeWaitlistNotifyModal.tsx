'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  getWaitlistedApplicationsForIntake,
  notifyWaitlistedStudents,
  type WaitlistedApplicationRow,
} from '@/actions/waitlist'
import { formatApplicationDate } from '@/lib/applications/format'

interface IntakeWaitlistNotifyModalProps {
  intakeId: string
  intakeName: string
  onClose: () => void
}

export default function IntakeWaitlistNotifyModal({
  intakeId,
  intakeName,
  onClose,
}: IntakeWaitlistNotifyModalProps) {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<WaitlistedApplicationRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    void getWaitlistedApplicationsForIntake(intakeId)
      .then((rows) => {
        if (cancelled) return
        setStudents(rows)
        setSelected(new Set(rows.map((r) => r.id)))
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('We could not load waitlisted students. Please try again.')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [intakeId])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(students.map((s) => s.id)) : new Set())
  }

  function handleSend() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await notifyWaitlistedStudents([...selected])
      if ('error' in result) {
        setError(result.error)
        return
      }
      setSuccess(`Notifications sent to ${result.notified} student${result.notified === 1 ? '' : 's'}.`)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-notify-title"
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 id="waitlist-notify-title" className="font-display text-lg font-semibold text-dark">
            Notify waitlist — {intakeName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Selected students receive an email and SMS that a spot may be available.
          </p>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading waitlisted students…</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-gray-500">No waitlisted students for this intake.</p>
          ) : (
            <>
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-dark">
                <input
                  type="checkbox"
                  checked={selected.size === students.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
                Select all ({students.length})
              </label>
              <ul className="space-y-2">
                {students.map((student) => (
                  <li
                    key={student.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 p-3"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selected.has(student.id)}
                      onChange={() => toggle(student.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-dark">{student.full_name}</p>
                      <p className="text-xs text-gray-500">{student.reference}</p>
                      {student.waitlist_position != null && (
                        <p className="text-xs text-[#7B5AE8]">#{student.waitlist_position}</p>
                      )}
                      {student.waitlist_notified_at && (
                        <p className="text-xs text-gray-400">
                          Notified {formatApplicationDate(student.waitlist_notified_at)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {error && (
          <p className="mx-6 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {success && (
          <p className="mx-6 mb-2 rounded-lg border border-[#2DBFB8]/30 bg-[#EBF9F8] px-3 py-2 text-sm text-[#1E9990]">
            {success}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            disabled={pending || loading || selected.size === 0}
            onClick={handleSend}
            className="rounded-full bg-[#7B5AE8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6A4AD4] disabled:opacity-50"
          >
            {pending ? 'Sending…' : `Send notifications (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}
