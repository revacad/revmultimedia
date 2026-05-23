'use client'

import { PasswordInput } from '@/components/ui/PasswordInput'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ModeBadge from '@/components/public/ModeBadge'
import { formatCategory } from '@/lib/courses/labels'
import { formatDate, formatGHS } from '@/lib/utils'
import { GENDER_OPTIONS, QUALIFICATION_OPTIONS } from '@/lib/apply/constants'
import {
  needsHybridConfirmation,
  type ApplyCourse,
  type ApplicationFormData,
} from '@/lib/apply/types'
import { formatFileSize } from '@/lib/apply/upload'

interface Step5ReviewProps {
  formData: Partial<ApplicationFormData>
  courses: ApplyCourse[]
  emailVerified: boolean
  hybridWarningAccepted: boolean
  onHybridWarningAccepted: (accepted: boolean) => void
  isSubmitting: boolean
  submitError: string | null
  onChange: (patch: Partial<ApplicationFormData>) => void
  onSubmit: () => void
}

function labelFor<T extends { value: string; label: string }>(
  options: readonly T[],
  value?: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value ?? 'Not provided'
}

export default function Step5Review({
  formData,
  courses,
  emailVerified,
  hybridWarningAccepted,
  onHybridWarningAccepted,
  isSubmitting,
  submitError,
  onChange,
  onSubmit,
}: Step5ReviewProps) {
  const course = courses.find((c) => c.id === formData.courseId)
  const intake = course?.intakes.find((i) => i.id === formData.intakeId)
  const showHybridCheckbox = needsHybridConfirmation(course?.mode, formData.country)
  const isGhana = formData.country === 'Ghana'

  const password = formData.password ?? ''
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
  ]

  const canSubmit =
    formData.infoConfirmed &&
    password.length >= 8 &&
    password === formData.confirmPassword &&
    (!showHybridCheckbox || hybridWarningAccepted)

  return (
    <div>
      <h2 className="font-display text-2xl text-dark">Almost there. Review your application.</h2>
      <p className="mb-6 mt-2 font-body text-[15px] text-gray-400">
        Please read through your details carefully before submitting. Once submitted, you will not be
        able to edit your application.
      </p>

      <ReviewSection title="Personal information">
        <ReviewRow label="Name" value={formData.fullName} />
        <ReviewRow label="Date of birth" value={formData.dateOfBirth} />
        <ReviewRow label="Gender" value={labelFor(GENDER_OPTIONS, formData.gender)} />
        <ReviewRow label="Country" value={formData.country} />
        <ReviewRow label="Phone" value={formData.phone} />
        <ReviewRow
          label="Email"
          value={
            <span className="inline-flex items-center gap-2">
              {formData.email}
              {emailVerified && (
                <span className="rounded-full bg-[#EBF9F8] px-2 py-0.5 text-xs text-[#2DBFB8]">
                  Verified
                </span>
              )}
            </span>
          }
        />
        <ReviewRow label="Address" value={formData.address} />
        <ReviewRow
          label={isGhana ? 'Region' : 'State / Province'}
          value={formData.stateRegion}
        />
        {!isGhana && <ReviewRow label="City" value={formData.city} />}
      </ReviewSection>

      <ReviewSection title="Course selection">
        <ReviewRow
          label="Course"
          value={
            course ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                {course.title}
                <Badge variant={course.category}>{formatCategory(course.category)}</Badge>
              </span>
            ) : (
              'Not provided'
            )
          }
        />
        <ReviewRow
          label="Intake"
          value={intake ? `${intake.name}, ${formatDate(intake.start_date)}` : 'Not provided'}
        />
        <ReviewRow
          label="Mode"
          value={course ? <ModeBadge mode={course.mode} /> : 'Not provided'}
        />
        <ReviewRow label="Tuition" value={course ? formatGHS(course.tuition_fee_ghs) : 'Not provided'} />
        {showHybridCheckbox && hybridWarningAccepted && (
          <ReviewRow label="Hybrid attendance" value="Confirmed" />
        )}
      </ReviewSection>

      <ReviewSection title="Education">
        <ReviewRow
          label="Qualification"
          value={labelFor(QUALIFICATION_OPTIONS, formData.qualification)}
        />
        <ReviewRow label="Institution" value={formData.institution} />
        <ReviewRow label="Year completed" value={formData.yearCompleted?.toString()} />
        {formData.priorExperience?.trim() && (
          <ReviewRow label="Experience" value={formData.priorExperience} />
        )}
      </ReviewSection>

      <ReviewSection title="Documents">
        <DocRow
          label={isGhana ? 'Ghana Card' : 'Passport'}
          file={formData.idDocument}
          required
        />
        <DocRow label="Passport photograph" file={formData.passportPhoto} required />
        {(formData.certificates ?? []).map((f, i) => (
          <DocRow key={f.key} label={`Certificate ${i + 1}`} file={f} />
        ))}
      </ReviewSection>

      <div className="mt-8 border-t border-gray-100 pt-8">
        <h3 className="font-display text-xl text-dark">Create your portal password</h3>
        <p className="mb-4 mt-1 text-sm text-gray-400">
          You will use this password to log in and track your application status.
        </p>
        <div className="flex flex-col gap-4">
          <PasswordInput
            label="Password"
            autoComplete="new-password"
            value={password}
            onChange={(value) => onChange({ password: value })}
          />
          <PasswordInput
            label="Confirm password"
            autoComplete="new-password"
            value={formData.confirmPassword ?? ''}
            onChange={(value) => onChange({ confirmPassword: value })}
            error={
              formData.confirmPassword && formData.confirmPassword !== password
                ? 'Passwords do not match'
                : undefined
            }
          />
          <ul className="text-sm text-gray-500">
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? 'text-[#2DBFB8]' : ''}>
                {c.ok ? '✓' : '○'} {c.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <label className="flex cursor-pointer items-start gap-2 text-sm text-dark">
          <input
            type="checkbox"
            className="mt-1"
            checked={Boolean(formData.infoConfirmed)}
            onChange={(e) => onChange({ infoConfirmed: e.target.checked })}
          />
          <span>
            I confirm that all information provided is accurate and complete to the best of my
            knowledge.
          </span>
        </label>

        {showHybridCheckbox && (
          <label className="flex cursor-pointer items-start gap-2 text-sm text-dark">
            <input
              type="checkbox"
              className="mt-1"
              checked={hybridWarningAccepted}
              onChange={(e) => {
                onHybridWarningAccepted(e.target.checked)
                onChange({ hybridAttendanceConfirmed: e.target.checked })
              }}
            />
            <span>
              I understand that this course includes in-person sessions in Accra, Ghana, and I can
              attend.
            </span>
          </label>
        )}
      </div>

      {submitError && (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {submitError}
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        size="xl"
        className="mt-6 w-full"
        disabled={!canSubmit || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? 'Submitting...' : 'Submit My Application'}
      </Button>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 border-b border-gray-100 pb-6 last:border-0">
      <h3 className="mb-3 font-semibold text-dark">{title}</h3>
      <dl className="flex flex-col gap-2">{children}</dl>
    </section>
  )
}

function ReviewRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="sm:col-span-2 text-dark">{value ?? 'Not provided'}</dd>
    </div>
  )
}

function DocRow({
  label,
  file,
  required,
}: {
  label: string
  file?: ApplicationFormData['idDocument']
  required?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-gray-500">{label}</span>
      {file ? (
        <span className="inline-flex items-center gap-2 text-dark">
          <svg className="h-4 w-4 text-[#2DBFB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {file.fileName} ({formatFileSize(file.fileSize)})
        </span>
      ) : (
        <span className={required ? 'text-red-500' : 'text-gray-400'}>
          {required ? 'Missing' : 'Not provided'}
        </span>
      )}
    </div>
  )
}
