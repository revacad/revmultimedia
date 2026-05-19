'use client'

import { useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import StepIndicator from '@/components/public/apply/StepIndicator'
import ConfirmationScreen from '@/components/public/apply/ConfirmationScreen'
import Step1Personal from '@/components/public/apply/steps/Step1Personal'
import Step2Course from '@/components/public/apply/steps/Step2Course'
import Step3Education from '@/components/public/apply/steps/Step3Education'
import Step4Documents from '@/components/public/apply/steps/Step4Documents'
import Step5Review from '@/components/public/apply/steps/Step5Review'
import { submitApplication } from '@/actions/application'
import type { ApplicationFormData, ApplyCourse } from '@/lib/apply/types'
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
} from '@/lib/apply/validation'

const TOTAL_STEPS = 5

interface ApplyPageClientProps {
  courses: ApplyCourse[]
  preselectedCourse?: string
  preselectedIntake?: string
}

export default function ApplyPageClient({
  courses,
  preselectedCourse,
  preselectedIntake,
}: ApplyPageClientProps) {
  const [draftId] = useState(() => crypto.randomUUID())
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<ApplicationFormData>>({})
  const [emailVerified, setEmailVerified] = useState(false)
  const [hybridWarningAccepted, setHybridWarningAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    reference?: string
    name: string
    email: string
  } | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [shakeNext, setShakeNext] = useState(false)

  const patchForm = useCallback((patch: Partial<ApplicationFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }))
  }, [])

  const step1Ready = useMemo(
    () =>
      (formData.fullName?.trim().length ?? 0) > 0 &&
      Boolean(formData.dateOfBirth) &&
      Boolean(formData.gender) &&
      Boolean(formData.country) &&
      (formData.phone?.trim().length ?? 0) > 0 &&
      emailVerified &&
      (formData.address?.trim().length ?? 0) > 0,
    [formData, emailVerified],
  )

  const stepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return validateStep1(formData, emailVerified)
      case 2:
        return validateStep2(formData, courses, hybridWarningAccepted)
      case 3:
        return validateStep3(formData)
      case 4:
        return validateStep4(formData)
      case 5:
        return validateStep5(formData, courses, hybridWarningAccepted)
      default:
        return false
    }
  }, [currentStep, formData, emailVerified, courses, hybridWarningAccepted])

  const canGoNext = currentStep === 1 ? step1Ready : stepValid

  const goNext = () => {
    if (!stepValid) {
      setValidationError('Please complete all required fields before continuing.')
      setShakeNext(true)
      setTimeout(() => setShakeNext(false), 500)
      return
    }
    setValidationError(null)
    setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }

  const goBack = () => {
    setValidationError(null)
    setCurrentStep((s) => Math.max(1, s - 1))
  }

  const handleSubmit = async () => {
    if (!validateStep5(formData, courses, hybridWarningAccepted)) {
      setSubmitError('Please complete all required fields before submitting.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    const payload = {
      email: formData.email!,
      fullName: formData.fullName!,
      phone: formData.phone!,
      dateOfBirth: formData.dateOfBirth!,
      gender: formData.gender!,
      country: formData.country!,
      address: formData.address!,
      stateRegion: formData.stateRegion,
      city: formData.city,
      qualification: formData.qualification!,
      institution: formData.institution!,
      yearCompleted: formData.yearCompleted!,
      priorExperience: formData.priorExperience,
      courseId: formData.courseId!,
      intakeId: formData.intakeId!,
      hybridAttendanceConfirmed: formData.hybridAttendanceConfirmed ?? hybridWarningAccepted,
      password: formData.password!,
      documents: {
        idDocument: formData.idDocument!,
        passportPhoto: formData.passportPhoto!,
        certificates: formData.certificates,
      },
    }

    const result = await submitApplication(payload)

    setIsSubmitting(false)

    if ('error' in result && result.error) {
      if (result.error === 'duplicate' && 'message' in result) {
        setSubmitError(result.message as string)
      } else {
        setSubmitError(
          typeof result.error === 'string'
            ? result.error
            : 'Failed to submit application. Please try again.',
        )
      }
      return
    }

    if ('success' in result && result.success) {
      setSubmitResult({
        success: true,
        reference: result.reference,
        name: result.applicantName ?? formData.fullName ?? '',
        email: result.email ?? formData.email ?? '',
      })
    }
  }

  if (submitResult?.success) {
    return (
      <section className="public-section public-section--muted px-4 py-12">
        <div className="mx-auto max-w-[720px] rounded-3xl border border-[#EFEFF5] bg-white p-10 shadow-[var(--shadow-card)]">
          <ConfirmationScreen
            name={submitResult.name || formData.fullName || ''}
            email={submitResult.email || formData.email || ''}
            reference={submitResult.reference || 'REVAPP202500001'}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="public-section public-section--muted px-4 py-12">
      <div className="mx-auto max-w-[720px]">
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        <div
          className="mx-auto max-w-[680px] rounded-3xl border border-[#EFEFF5] bg-white p-10 shadow-[var(--shadow-card)]"
        >
          {currentStep === 1 && (
            <Step1Personal
              formData={formData}
              emailVerified={emailVerified}
              onChange={patchForm}
              onEmailVerified={setEmailVerified}
            />
          )}
          {currentStep === 2 && (
            <Step2Course
              courses={courses}
              formData={formData}
              preselectedCourse={preselectedCourse}
              preselectedIntake={preselectedIntake}
              hybridWarningAccepted={hybridWarningAccepted}
              onHybridWarningAccepted={setHybridWarningAccepted}
              onChange={patchForm}
            />
          )}
          {currentStep === 3 && (
            <Step3Education formData={formData} onChange={patchForm} />
          )}
          {currentStep === 4 && (
            <Step4Documents draftId={draftId} formData={formData} onChange={patchForm} />
          )}
          {currentStep === 5 && (
            <Step5Review
              formData={formData}
              courses={courses}
              emailVerified={emailVerified}
              hybridWarningAccepted={hybridWarningAccepted}
              onHybridWarningAccepted={setHybridWarningAccepted}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onChange={patchForm}
              onSubmit={() => void handleSubmit()}
            />
          )}

          {currentStep < 5 && (
            <>
              {validationError && (
                <p className="mt-6 font-body text-sm text-[#E84A4A]" role="alert">
                  {validationError}
                </p>
              )}
              <div className="mt-6 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={goBack}
                  disabled={currentStep === 1}
                  className={currentStep === 1 ? 'invisible' : ''}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={goNext}
                  disabled={!canGoNext}
                  className={cn(shakeNext && 'animate-[shake_0.4s_ease-in-out]')}
                >
                  Next
                </Button>
              </div>
            </>
          )}

          {currentStep === 5 && (
            <div className="mt-6">
              <Button type="button" variant="ghost" size="md" onClick={goBack}>
                Back
              </Button>
            </div>
          )}
        </div>
        </div>
    </section>
  )
}
