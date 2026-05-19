'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCourse } from '@/actions/course'

interface CourseDeleteButtonProps {
  courseId: string
  courseTitle: string
}

export default function CourseDeleteButton({
  courseId,
  courseTitle,
}: CourseDeleteButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${courseTitle}"? This cannot be undone.`,
    )
    if (!confirmed) return

    setError(null)
    startTransition(async () => {
      const result = await deleteCourse(courseId)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {pending ? 'Deleting…' : 'Delete'}
      </button>
      {error && (
        <span className="max-w-[12rem] text-right text-xs text-red-600">{error}</span>
      )}
    </span>
  )
}
