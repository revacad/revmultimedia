'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { deleteIntake } from '@/actions/intake'
import type { Intake } from '@/lib/courses/types'

interface IntakeDeleteModalProps {
  intake: Intake & { course?: { title: string } }
  onClose: () => void
}

export default function IntakeDeleteModal({ intake, onClose }: IntakeDeleteModalProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleDelete() {
    setLoading(true)
    setError(null)

    const result = await deleteIntake(intake.id)

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-intake-title"
        className="w-full max-w-md rounded-xl border border-[#EFEFF5] bg-white p-5 shadow-card sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="delete-intake-title"
          className="font-display text-xl font-semibold text-[#1A1A2E]"
        >
          Delete this intake?
        </h2>
        <p className="mt-2 font-body text-sm text-[#5A5A7A]">
          This cannot be undone. Any applications linked to this intake will be affected.
        </p>
        <p className="mt-3 font-body text-sm font-medium text-[#1A1A2E]">
          {intake.name}
          {intake.course?.title ? (
            <span className="font-normal text-[#5A5A7A]"> · {intake.course.title}</span>
          ) : null}
        </p>

        {error ? (
          <p className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => void handleDelete()}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}
