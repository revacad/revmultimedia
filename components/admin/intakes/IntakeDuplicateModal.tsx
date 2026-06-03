'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import {
  AdminLabel,
  AdminFieldGrid,
  adminFieldClassName,
} from '@/components/admin/AdminFormPrimitives'
import { createIntakesForCourses } from '@/actions/intake'
import type { Intake } from '@/lib/courses/types'

export type IntakeCourseOption = {
  id: string
  title: string
}

interface IntakeDuplicateModalProps {
  intake: Intake
  courses: IntakeCourseOption[]
  onClose: () => void
}

export default function IntakeDuplicateModal({
  intake,
  courses,
  onClose,
}: IntakeDuplicateModalProps) {
  const router = useRouter()
  const [name, setName] = useState(`${intake.name} - copy`)
  const [startDate, setStartDate] = useState(intake.start_date)
  const [endDate, setEndDate] = useState(intake.end_date)
  const [maxSlots, setMaxSlots] = useState(
    intake.max_slots != null ? String(intake.max_slots) : '',
  )
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(() => {
    const initial = new Set(courses.map((c) => c.id))
    initial.delete(intake.course_id)
    return initial
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function toggleCourse(courseId: string) {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev)
      if (next.has(courseId)) {
        next.delete(courseId)
      } else {
        next.add(courseId)
      }
      return next
    })
  }

  async function handleCreateCopies() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await createIntakesForCourses([...selectedCourseIds], {
      name,
      start_date: startDate,
      end_date: endDate,
      application_deadline: intake.application_deadline ?? undefined,
      max_slots: maxSlots ? Number(maxSlots) : undefined,
    })

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    const count = result.data?.count ?? selectedCourseIds.size
    setSuccess(`Intake duplicated to ${count} courses.`)
    router.refresh()
    window.setTimeout(onClose, 1500)
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
        aria-labelledby="duplicate-intake-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#EFEFF5] bg-white p-5 shadow-card sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="duplicate-intake-title"
              className="font-display text-xl font-semibold text-[#1A1A2E]"
            >
              Duplicate intake
            </h2>
            <p className="mt-1 font-body text-sm text-[#5A5A7A]">
              Create copies for selected courses based on &ldquo;{intake.name}&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#9898B8] hover:bg-[#F7F8FC] hover:text-[#1A1A2E]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-4 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <AdminLabel htmlFor="duplicate-name">Intake name</AdminLabel>
            <input
              id="duplicate-name"
              className={adminFieldClassName}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <AdminFieldGrid>
            <div>
              <AdminLabel htmlFor="duplicate-start">Start date</AdminLabel>
              <input
                id="duplicate-start"
                type="date"
                className={adminFieldClassName}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <AdminLabel htmlFor="duplicate-end">End date</AdminLabel>
              <input
                id="duplicate-end"
                type="date"
                className={adminFieldClassName}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </AdminFieldGrid>

          <div>
            <AdminLabel htmlFor="duplicate-slots">Max slots</AdminLabel>
            <input
              id="duplicate-slots"
              type="number"
              min={1}
              className={adminFieldClassName}
              value={maxSlots}
              onChange={(e) => setMaxSlots(e.target.value)}
            />
          </div>

          <div>
            <AdminLabel>Courses</AdminLabel>
            <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-[10px] border border-[#EFEFF5] p-3">
              {courses.map((course) => (
                <li key={course.id}>
                  <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-[#1A1A2E]">
                    <input
                      type="checkbox"
                      checked={selectedCourseIds.has(course.id)}
                      onChange={() => toggleCourse(course.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary/30"
                    />
                    <span>{course.title}</span>
                    {course.id === intake.course_id ? (
                      <span className="text-xs text-[#9898B8]">(original)</span>
                    ) : null}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={loading || selectedCourseIds.size === 0 || !name.trim()}
            onClick={() => void handleCreateCopies()}
          >
            {loading ? 'Creating…' : 'Create copies'}
          </Button>
        </div>
      </div>
    </div>
  )
}
