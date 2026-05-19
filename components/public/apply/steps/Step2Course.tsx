'use client'

import { useEffect, useMemo } from 'react'
import Badge from '@/components/ui/Badge'
import ModeBadge from '@/components/public/ModeBadge'
import { formatCategory } from '@/lib/courses/labels'
import { isInternational, needsHybridConfirmation, type ApplyCourse } from '@/lib/apply/types'
import type { ApplicationFormData } from '@/lib/apply/types'

interface Step2CourseProps {
  courses: ApplyCourse[]
  formData: Partial<ApplicationFormData>
  preselectedCourse?: string
  preselectedIntake?: string
  hybridWarningAccepted: boolean
  onHybridWarningAccepted: (accepted: boolean) => void
  onChange: (patch: Partial<ApplicationFormData>) => void
}

function intakeSlotsRemaining(intake: ApplyCourse['intakes'][0]): number | null {
  if (intake.max_slots == null) return null
  return Math.max(0, intake.max_slots - intake.enrolled_count)
}

function formatTuition(amount: number): string {
  return `GHS ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function intakeOptionLabel(intake: ApplyCourse['intakes'][0]): string {
  const remaining = intakeSlotsRemaining(intake)
  if (remaining !== null) {
    const full = remaining <= 0
    return `${intake.name} — ${full ? 'Full' : `${remaining} spots left`}`
  }
  return intake.name
}

export default function Step2Course({
  courses,
  formData,
  preselectedCourse,
  preselectedIntake,
  hybridWarningAccepted,
  onHybridWarningAccepted,
  onChange,
}: Step2CourseProps) {
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === formData.courseId),
    [courses, formData.courseId],
  )

  useEffect(() => {
    if (!preselectedCourse || formData.courseId) return
    const match = courses.find((c) => c.slug === preselectedCourse)
    if (match) onChange({ courseId: match.id, intakeId: undefined })
  }, [preselectedCourse, courses, formData.courseId, onChange])

  useEffect(() => {
    if (!preselectedIntake || formData.intakeId) return
    if (!selectedCourse) return
    const intake = selectedCourse.intakes.find((i) => i.id === preselectedIntake)
    if (intake) onChange({ intakeId: intake.id })
  }, [preselectedIntake, selectedCourse, formData.intakeId, onChange])

  const showHybridWarning =
    selectedCourse && needsHybridConfirmation(selectedCourse.mode, formData.country)
  const showInPersonNote =
    selectedCourse?.mode === 'in_person' && isInternational(formData.country)

  return (
    <div>
      <h2 className="font-display text-2xl text-dark">What do you want to learn?</h2>
      <p className="mb-6 mt-2 font-body text-[15px] text-gray-400">
        Choose the course and intake you want to apply for. You can only apply for one course at a time.
      </p>

      <div className="flex flex-col gap-4">
        <fieldset className="border-0 p-0">
          <legend className="mb-3 text-[13px] font-medium text-gray-600">Select a course</legend>

          {courses.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                border: '1.5px dashed #D8D8E8',
                borderRadius: '14px',
                backgroundColor: '#F7F8FC',
              }}
            >
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '15px',
                  color: '#9898B8',
                }}
              >
                No courses are currently open for applications. Please check back soon or
                contact us at info@revmultimediagh.com
              </p>
            </div>
          ) : (
            courses.map((course) => {
              const selected = formData.courseId === course.id
              return (
                <label
                  key={course.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 20px',
                    marginBottom: '12px',
                    backgroundColor: selected ? '#FDF0F6' : '#ffffff',
                    border: selected ? '1.5px solid #C74A86' : '1.5px solid #EFEFF5',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selected ? '0 0 0 3px rgba(199,74,134,0.10)' : 'none',
                  }}
                >
                  <input
                    type="radio"
                    name="course"
                    className="sr-only"
                    checked={selected}
                    onChange={() => onChange({ courseId: course.id, intakeId: undefined })}
                  />

                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      flexShrink: 0,
                      borderRadius: '50%',
                      border: `2px solid ${selected ? '#C74A86' : '#D8D8E8'}`,
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-hidden
                  >
                    {selected && (
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: '#C74A86',
                        }}
                      />
                    )}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 600,
                        fontSize: '16px',
                        color: '#1A1A2E',
                        marginBottom: '8px',
                      }}
                    >
                      {course.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={course.category}>{formatCategory(course.category)}</Badge>
                      <ModeBadge mode={course.mode} />
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: 'Clash Display, sans-serif',
                      fontSize: '18px',
                      color: '#C74A86',
                      flexShrink: 0,
                    }}
                  >
                    {formatTuition(course.tuition_fee_ghs)}
                  </span>
                </label>
              )
            })
          )}
        </fieldset>

        {selectedCourse && selectedCourse.intakes.length > 0 && (
          <div>
            <label
              htmlFor="intake-select"
              className="mb-1.5 block text-[13px] font-medium text-gray-600"
            >
              Select an intake
            </label>
            <select
              id="intake-select"
              required
              value={formData.intakeId ?? ''}
              onChange={(e) => onChange({ intakeId: e.target.value })}
              style={{
                width: '100%',
                padding: '13px 16px',
                border: '1.5px solid #D8D8E8',
                borderRadius: '10px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '15px',
                color: '#1A1A2E',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>
                Choose intake
              </option>
              {selectedCourse.intakes.map((intake) => {
                const remaining = intakeSlotsRemaining(intake)
                const full = remaining !== null && remaining <= 0
                return (
                  <option key={intake.id} value={intake.id} disabled={full}>
                    {intakeOptionLabel(intake)}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {showInPersonNote && (
          <div className="rounded-[14px] border-[1.5px] border-[#2DBFB8] bg-[#EBF9F8] p-4 text-sm text-dark">
            This course is delivered in-person at our campus in Weija, Accra, Ghana.
          </div>
        )}

        {showHybridWarning && (
          <div className="rounded-[14px] border-[1.5px] border-[#F18F3B] bg-[#FEF6EE] p-4">
            <p className="text-sm text-dark">
              This cohort includes in-person sessions at our Weija, Accra campus. International
              students are welcome, but you must be able to travel to Accra for the in-person
              sessions. Please confirm below before continuing.
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={hybridWarningAccepted}
                onChange={(e) => {
                  onHybridWarningAccepted(e.target.checked)
                  onChange({ hybridAttendanceConfirmed: e.target.checked })
                }}
              />
              <span className="text-sm text-dark">
                I understand that this cohort includes in-person sessions in Accra, Ghana, and I
                confirm that I am able to attend.
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
