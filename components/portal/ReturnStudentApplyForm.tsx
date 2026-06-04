'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { LogoLoader } from '@/components/ui/LogoLoader'
import Button from '@/components/ui/Button'
import StepIndicator from '@/components/public/apply/StepIndicator'
import Step2Course from '@/components/public/apply/steps/Step2Course'
import {
  checkSameIntakeEnrollment,
  submitReturnStudentApplication,
} from '@/actions/portal-application'
import type { ApplyCourse } from '@/lib/apply/types'
import type { ApplicationFormData } from '@/lib/apply/types'
import { formatGHS } from '@/lib/utils'
import { getStepValidation, type ApplyFieldErrors } from '@/lib/apply/validation'

const RETURN_STUDENT_STEP_LABELS = ['Personal Info', 'Course', 'Review'] as const

const TOTAL_STEPS = RETURN_STUDENT_STEP_LABELS.length

function validationStepForUiStep(uiStep: number): number | null {
  if (uiStep === 1) return null
  if (uiStep === 2) return 2
  if (uiStep === 3) return 5
  return null
}

interface ReturnStudentApplyFormProps {
  courses: ApplyCourse[]
  initialCourseId?: string
  initialIntakeId?: string
  student: {
    fullName: string
    realEmail: string
    phone: string
    studentId: string
  }
}

export default function ReturnStudentApplyForm({
  courses,
  initialCourseId,
  initialIntakeId,
  student,
}: ReturnStudentApplyFormProps) {
  const [idempotencyKey] = useState(
    () => `portal-apply-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  const [currentStep, setCurrentStep] = useState(initialCourseId && initialIntakeId ? 2 : 1)
  const [formData, setFormData] = useState<Partial<ApplicationFormData>>(() => ({
    country: 'Ghana',
    ...(initialCourseId ? { courseId: initialCourseId } : {}),
    ...(initialIntakeId ? { intakeId: initialIntakeId } : {}),
  }))
  const [hybridWarningAccepted, setHybridWarningAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successRef, setSuccessRef] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ApplyFieldErrors>({})
  const [showValidation, setShowValidation] = useState(false)
  const [sameIntakeError, setSameIntakeError] = useState<string | null>(null)
  const [checkingSameIntake, setCheckingSameIntake] = useState(false)

  const patchForm = useCallback((patch: Partial<ApplicationFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }))
    if ('intakeId' in patch) {
      setSameIntakeError(null)
    }
  }, [])

  useEffect(() => {
    if (currentStep !== 2 || !formData.intakeId) {
      setSameIntakeError(null)
      setCheckingSameIntake(false)
      return
    }

    const intakeId = formData.intakeId
    let cancelled = false

    const timer = window.setTimeout(() => {
      setCheckingSameIntake(true)
      void checkSameIntakeEnrollment(intakeId)
        .then((result) => {
          if (cancelled) return
          setCheckingSameIntake(false)
          setSameIntakeError(result.conflict ? result.message : null)
        })
        .catch(() => {
          if (cancelled) return
          setCheckingSameIntake(false)
        })
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [currentStep, formData.intakeId])

  const goNext = () => {
    if (currentStep === 2 && sameIntakeError) {
      return
    }
    const validationStep = validationStepForUiStep(currentStep)
    if (validationStep !== null) {
      const result = getStepValidation(validationStep, formData, {
        emailVerified: true,
        courses,
        hybridWarningAccepted,
        skipPassword: true,
      })
      if (!result.valid) {
        setFieldErrors(result.errors)
        setShowValidation(true)
        return
      }
    }
    setFieldErrors({})
    setShowValidation(false)
    setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }

  const goBack = () => setCurrentStep((s) => Math.max(1, s - 1))

  const handleSubmit = async () => {
    const result = getStepValidation(5, formData, {
      emailVerified: true,
      courses,
      hybridWarningAccepted,
      skipPassword: true,
    })
    if (!result.valid) {
      setFieldErrors(result.errors)
      setShowValidation(true)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await submitReturnStudentApplication({
        idempotencyKey,
        courseId: formData.courseId!,
        intakeId: formData.intakeId!,
        hybridAttendanceConfirmed: formData.hybridAttendanceConfirmed ?? hybridWarningAccepted,
      })

      if ('error' in res && res.error) {
        setSubmitError(typeof res.error === 'string' ? res.error : 'Submission failed')
        return
      }
      if ('success' in res && res.success) {
        setSuccessRef(res.reference)
      }
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const reviewCourse = useMemo(
    () => courses.find((c) => c.id === formData.courseId),
    [courses, formData.courseId],
  )
  const reviewIntake = useMemo(
    () => reviewCourse?.intakes.find((i) => i.id === formData.intakeId),
    [reviewCourse, formData.intakeId],
  )

  if (successRef) {
    return (
      <article className="rounded-xl bg-white p-8 shadow-card">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Application submitted</h1>
        <p className="mt-3 font-body text-[15px] text-[#5A5A7A]">
          Your new application reference is{' '}
          <span className="font-mono font-semibold text-[#C74A86]">{successRef}</span>. Pay the
          application fee from your portal when ready.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/portal/dashboard"
            className="inline-flex rounded-full bg-primary px-5 py-2.5 font-body text-sm font-semibold text-white"
          >
            View application status
          </Link>
          <Link
            href="/portal/dashboard"
            className="inline-flex rounded-full border border-[#D8D8E8] px-5 py-2.5 font-body text-sm font-semibold text-[#5A5A7A]"
          >
            Back to dashboard
          </Link>
        </div>
      </article>
    )
  }

  return (
    <div>
      {isSubmitting && <LogoLoader fullScreen text="Submitting your application..." />}

      <p className="mb-6 font-body text-sm text-[#9898B8]">
        Applying as <span className="font-semibold text-[#1A1A2E]">{student.fullName}</span> (
        {student.studentId}) · {student.realEmail} · {student.phone}
      </p>

      <StepIndicator
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        stepLabels={RETURN_STUDENT_STEP_LABELS}
      />

      <div className="mt-8">
        {currentStep === 1 && (
          <div className="rounded-2xl border border-[#EFEFF5] bg-white p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold text-[#1A1A2E]">
              Personal information
            </h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-[#5A5A7A]">
              Your personal details are pre-filled from your student record. Contact us to update
              them.
            </p>
            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: 'Full name', value: student.fullName },
                { label: 'Email', value: student.realEmail },
                { label: 'Phone', value: student.phone },
                { label: 'Student ID', value: student.studentId },
              ].map((row) => (
                <div key={row.label} className="rounded-xl bg-[#F7F8FC] px-4 py-3">
                  <dt className="font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
                    {row.label}
                  </dt>
                  <dd className="mt-1 font-body text-sm font-semibold text-[#1A1A2E]">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {currentStep === 2 && (
          <Step2Course
            formData={formData}
            courses={courses}
            fieldErrors={fieldErrors}
            showValidation={showValidation}
            sameIntakeError={sameIntakeError}
            hybridWarningAccepted={hybridWarningAccepted}
            onHybridWarningAccepted={setHybridWarningAccepted}
            onChange={patchForm}
          />
        )}
        {currentStep === 3 && (
          <div>
            <h2 className="font-display text-2xl text-[#1A1A2E]">Review and submit</h2>
            <p className="mb-4 mt-2 font-body text-[15px] text-[#9898B8]">
              Confirm your course choice. Your education details from your previous application will
              be reused.
            </p>
            <div className="mb-6 rounded-[14px] border border-[#EFEFF5] bg-[#FFFBEB] px-4 py-3">
              <p className="font-body text-sm text-[#5A5A7A]">
                Your documents from your previous application will be used for this application.
              </p>
            </div>
            {reviewCourse ? (
              <div className="mb-6 rounded-[14px] border border-[#EFEFF5] bg-[#F7F8FC] p-4">
                <p className="font-body text-sm font-semibold text-[#1A1A2E]">{reviewCourse.title}</p>
                {reviewIntake && (
                  <p className="mt-1 font-body text-sm text-[#5A5A7A]">Intake: {reviewIntake.name}</p>
                )}
                <p className="mt-2 font-body text-sm font-semibold text-[#C74A86]">
                  Tuition: {formatGHS(reviewCourse.tuition_fee_ghs)}
                </p>
              </div>
            ) : null}
            <label className="flex cursor-pointer items-start gap-2 text-sm text-[#1A1A2E]">
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(formData.infoConfirmed)}
                onChange={(e) => patchForm({ infoConfirmed: e.target.checked })}
              />
              <span>I confirm the information provided is accurate.</span>
            </label>
            {showValidation && fieldErrors.infoConfirmed && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.infoConfirmed}</p>
            )}
          </div>
        )}
      </div>

      {submitError && (
        <p className="mt-4 font-body text-sm text-red-600" role="alert">
          {submitError}
        </p>
      )}

      <div className="mt-8 flex justify-between gap-4">
        {currentStep > 1 ? (
          <Button type="button" variant="secondary" onClick={goBack}>
            Back
          </Button>
        ) : (
          <Link
            href="/portal/dashboard"
            className="inline-flex items-center font-body text-sm font-semibold text-[#9898B8] hover:text-[#C74A86]"
          >
            Cancel
          </Link>
        )}
        {currentStep < TOTAL_STEPS ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={
              (currentStep === 2 && Boolean(sameIntakeError)) || checkingSameIntake
            }
          >
            Continue
          </Button>
        ) : (
          <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            Submit application
          </Button>
        )}
      </div>
    </div>
  )
}
