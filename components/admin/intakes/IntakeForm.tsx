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
import { createIntake, createIntakeForAllCourses, updateIntake } from '@/actions/intake'
import type { Course, Intake } from '@/lib/courses/types'
import { cn } from '@/lib/utils'

interface IntakeFormProps {
  courses: Course[]
  intake?: Intake
  defaultCourseId?: string
}

function intakeFieldsFromFormData(formData: FormData) {
  return {
    name: String(formData.get('name') ?? ''),
    start_date: String(formData.get('start_date') ?? ''),
    end_date: String(formData.get('end_date') ?? ''),
    application_deadline:
      String(formData.get('application_deadline') ?? '') || undefined,
    max_slots: formData.get('max_slots') ? Number(formData.get('max_slots')) : undefined,
  }
}

export default function IntakeForm({
  courses,
  intake,
  defaultCourseId,
}: IntakeFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [applyToAllCourses, setApplyToAllCourses] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)

    let result
    if (intake) {
      result = await updateIntake(intake.id, formData)
    } else if (applyToAllCourses) {
      result = await createIntakeForAllCourses(intakeFieldsFromFormData(formData))
    } else {
      result = await createIntake(formData)
    }

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    if (!intake && applyToAllCourses && result.data && 'count' in result.data) {
      setSuccess(`Intake created for ${result.data.count} courses.`)
      window.setTimeout(() => {
        router.push('/admin/intakes')
        router.refresh()
      }, 1500)
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
        {success && (
          <p className="mb-6 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        )}

        <AdminFormSection title="Cohort details">
          {!intake && (
            <div className="mb-5 flex items-center justify-between gap-4 rounded-[10px] border border-[#EFEFF5] bg-[#FAFAFC] px-4 py-3">
              <span className="font-body text-sm font-medium text-[#1A1A2E]">
                Apply to all courses
              </span>
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    !applyToAllCourses ? 'text-[#1A1A2E]' : 'text-[#9898B8]',
                  )}
                >
                  No
                </span>
                <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={applyToAllCourses}
                    onChange={(e) => setApplyToAllCourses(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-[#D8D8E8] transition-colors peer-checked:bg-[#C74A86] peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30" />
                  <span className="absolute left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    applyToAllCourses ? 'text-[#1A1A2E]' : 'text-[#9898B8]',
                  )}
                >
                  Yes
                </span>
              </label>
            </div>
          )}

          {!applyToAllCourses || intake ? (
            <>
              <AdminLabel htmlFor="course_id">Course</AdminLabel>
              <select
                id="course_id"
                name="course_id"
                className={adminFieldClassName}
                defaultValue={intake?.course_id ?? defaultCourseId ?? ''}
                required={!applyToAllCourses}
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
            </>
          ) : (
            <p className="font-body text-sm text-[#5A5A7A]">
              This intake will be created for all {courses.length} courses with the same name,
              dates, and capacity.
            </p>
          )}

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
            <p className="mt-2 font-body text-sm text-[#9898B8]">
              You can add multiple intakes per course (for example March and September cohorts).
              Close an intake when it is full or finished so applicants can move to the next one.
            </p>
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
            {loading
              ? 'Saving…'
              : intake
                ? 'Update intake'
                : applyToAllCourses
                  ? 'Create for all courses'
                  : 'Create intake'}
          </Button>
        </AdminFormSection>
      </form>
    </AdminFormCard>
  )
}
