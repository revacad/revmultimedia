'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { LogoLoader } from '@/components/ui/LogoLoader'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import StepIndicator from '@/components/public/apply/StepIndicator'
import ConfirmationScreen from '@/components/public/apply/ConfirmationScreen'
import Step1Personal from '@/components/public/apply/steps/Step1Personal'
import Step2Course from '@/components/public/apply/steps/Step2Course'
import Step3Education from '@/components/public/apply/steps/Step3Education'
import Step4Documents from '@/components/public/apply/steps/Step4Documents'
import Step5Review from '@/components/public/apply/steps/Step5Review'
import HoneypotField from '@/components/public/HoneypotField'
import { submitApplication } from '@/actions/application'
import type { ApplicationFormData, ApplyCourse } from '@/lib/apply/types'
import {
  type ApplyFieldErrors,
  applyFieldId,
  getStepValidation,
  validateStep5,
} from '@/lib/apply/validation'

const TOTAL_STEPS = 5
const STORAGE_KEY = 'rev_application_draft'
const SUBMIT_TIMEOUT_MS = 30_000

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
  const [idempotencyKey] = useState(
    () => `apply-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  const [currentStep, setCurrentStep] = useState(1)
  const [restoredFromDraft, setRestoredFromDraft] = useState(false)
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
  const [fieldErrors, setFieldErrors] = useState<ApplyFieldErrors>({})
  const [showValidation, setShowValidation] = useState(false)
  const [shakeNext, setShakeNext] = useState(false)
  const [website, setWebsite] = useState('')

  const patchForm = useCallback((patch: Partial<ApplicationFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }))
  }, [])

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (!saved) return

      const parsed = JSON.parse(saved) as {
        formData: Partial<ApplicationFormData>
        currentStep: number
        emailVerified?: boolean
        savedAt: string
      }

      const savedAt = new Date(parsed.savedAt)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

      if (savedAt > twoHoursAgo && parsed.currentStep > 1) {
        setFormData(parsed.formData)
        setCurrentStep(parsed.currentStep)
        setEmailVerified(parsed.emailVerified ?? false)
        setRestoredFromDraft(true)
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }, [])

  useEffect(() => {
    if (currentStep > 1) {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            formData,
            currentStep,
            emailVerified,
            savedAt: new Date().toISOString(),
          }),
        )
      } catch {
        // sessionStorage may be unavailable
      }
    }
  }, [formData, currentStep, emailVerified])

  const stepValidation = useMemo(
    () =>
      getStepValidation(currentStep, formData, {
        emailVerified,
        courses,
        hybridWarningAccepted,
      }),
    [currentStep, formData, emailVerified, courses, hybridWarningAccepted],
  )

  useEffect(() => {
    if (!showValidation) return
    setFieldErrors(stepValidation.errors)
    setValidationError(stepValidation.summary)
  }, [showValidation, stepValidation])

  const scrollToFirstError = (errors: ApplyFieldErrors) => {
    const firstKey = Object.keys(errors)[0]
    if (!firstKey) return
    requestAnimationFrame(() => {
      document.getElementById(applyFieldId(firstKey as keyof ApplyFieldErrors))?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }

  const goNext = () => {
    const result = getStepValidation(currentStep, formData, {
      emailVerified,
      courses,
      hybridWarningAccepted,
    })
    if (!result.valid) {
      setFieldErrors(result.errors)
      setShowValidation(true)
      setValidationError(result.summary)
      setShakeNext(true)
      setTimeout(() => setShakeNext(false), 500)
      scrollToFirstError(result.errors)
      return
    }
    setFieldErrors({})
    setShowValidation(false)
    setValidationError(null)
    setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }

  const goBack = () => {
    setFieldErrors({})
    setShowValidation(false)
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
      website,
      idempotencyKey,
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

    const timeoutId = setTimeout(() => {
      setIsSubmitting(false)
      setSubmitError(
        'Submission is taking longer than expected. ' +
          'Please check your connection and try again. ' +
          'If the problem persists, contact us at info@revmultimedia.com',
      )
    }, SUBMIT_TIMEOUT_MS)

    try {
      const result = await submitApplication(payload)
      clearTimeout(timeoutId)

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
        try {
          sessionStorage.removeItem(STORAGE_KEY)
        } catch {
          // Ignore
        }
        setSubmitResult({
          success: true,
          reference: result.reference,
          name: result.applicantName ?? formData.fullName ?? '',
          email: result.email ?? formData.email ?? '',
        })
      }
    } catch {
      clearTimeout(timeoutId)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      clearTimeout(timeoutId)
      setIsSubmitting(false)
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
      {isSubmitting && <LogoLoader fullScreen text="Submitting your application..." />}
      <div className="mx-auto max-w-[720px]">
        {restoredFromDraft && (
          <div
            style={{
              backgroundColor: '#EBF9F8',
              border: '1px solid rgba(45,191,184,0.30)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#1E9990',
              }}
            >
              Your previous progress has been restored.
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem(STORAGE_KEY)
                } catch {
                  // Ignore
                }
                setFormData({})
                setCurrentStep(1)
                setEmailVerified(false)
                setRestoredFromDraft(false)
              }}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#9898B8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Start fresh
            </button>
          </div>
        )}
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        <div
          className="relative mx-auto max-w-[680px] rounded-3xl border border-[#EFEFF5] bg-white p-10 shadow-[var(--shadow-card)]"
        >
          <HoneypotField value={website} onChange={setWebsite} />
          {currentStep === 1 && (
            <Step1Personal
              formData={formData}
              emailVerified={emailVerified}
              fieldErrors={fieldErrors}
              showValidation={showValidation}
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
              fieldErrors={fieldErrors}
              showValidation={showValidation}
              onChange={patchForm}
            />
          )}
          {currentStep === 3 && (
            <Step3Education
              formData={formData}
              fieldErrors={fieldErrors}
              showValidation={showValidation}
              onChange={patchForm}
            />
          )}
          {currentStep === 4 && (
            <Step4Documents
              draftId={draftId}
              formData={formData}
              fieldErrors={fieldErrors}
              showValidation={showValidation}
              onChange={patchForm}
            />
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
