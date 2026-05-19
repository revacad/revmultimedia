'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import {
  AdminFormCard,
  AdminFormSection,
  AdminLabel,
  AdminFieldGrid,
  adminFieldClassName,
} from '@/components/admin/AdminFormPrimitives'
import { createIntake, updateIntake } from '@/actions/intake'
import type { Course, Intake } from '@/lib/courses/types'

interface IntakeFormProps {
  courses: Course[]
  intake?: Intake
  defaultCourseId?: string
}

export default function IntakeForm({
  courses,
  intake,
  defaultCourseId,
}: IntakeFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = intake
      ? await updateIntake(intake.id, formData)
      : await createIntake(formData)

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.push('/admin/intakes')
    router.refresh()
  }

  return (
    <AdminFormCard>
      <form action={handleSubmit} className="space-y-0">
        {error && (
          <p className="mb-6 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <AdminFormSection title="Cohort details">
          <AdminLabel htmlFor="course_id">Course</AdminLabel>
          <select
            id="course_id"
            name="course_id"
            className={adminFieldClassName}
            defaultValue={intake?.course_id ?? defaultCourseId ?? ''}
            required
          >
            <option value="" disabled>
              Select a course
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>

          <div className="mt-5">
            <AdminLabel htmlFor="name">Intake name</AdminLabel>
            <input
              id="name"
              name="name"
              className={adminFieldClassName}
              defaultValue={intake?.name}
              placeholder="e.g. March 2026 Cohort"
              required
            />
          </div>
        </AdminFormSection>

        <AdminFormSection title="Schedule">
          <AdminFieldGrid>
            <div>
              <AdminLabel htmlFor="start_date">Start date</AdminLabel>
              <input
                id="start_date"
                name="start_date"
                type="date"
                className={adminFieldClassName}
                defaultValue={intake?.start_date}
                required
              />
            </div>
            <div>
              <AdminLabel htmlFor="end_date">End date</AdminLabel>
              <input
                id="end_date"
                name="end_date"
                type="date"
                className={adminFieldClassName}
                defaultValue={intake?.end_date}
                required
              />
            </div>
          </AdminFieldGrid>

          <AdminFieldGrid>
            <div>
              <AdminLabel htmlFor="application_deadline">Application deadline</AdminLabel>
              <input
                id="application_deadline"
                name="application_deadline"
                type="date"
                className={adminFieldClassName}
                defaultValue={intake?.application_deadline ?? ''}
              />
            </div>
            <div>
              <AdminLabel htmlFor="max_slots">Max slots</AdminLabel>
              <input
                id="max_slots"
                name="max_slots"
                type="number"
                min={1}
                className={adminFieldClassName}
                defaultValue={intake?.max_slots ?? ''}
              />
            </div>
          </AdminFieldGrid>
        </AdminFormSection>

        <AdminFormSection title="Actions" isLast>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving…' : intake ? 'Update intake' : 'Create intake'}
          </Button>
        </AdminFormSection>
      </form>
    </AdminFormCard>
  )
}
