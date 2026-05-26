'use client'

import { useState, useTransition } from 'react'
import { sendAdmissionLetter } from '@/actions/admission-letter'
import ViewDocumentButton from '@/components/admin/applications/ViewDocumentButton'
import { formatApplicationDate } from '@/lib/applications/format'
import {
  deriveProgramLifecycleStatus,
  PROGRAM_STATUS_LABELS,
  sumTuitionPaidFromInvoices,
} from '@/lib/enrollment/program-status'

interface SendAdmissionLetterCardProps {
  applicationId: string
  applicationStatus: string
  enrolledAt: string | null
  admissionLetterSentAt: string | null
  admissionLetterR2Key: string | null
  hasStudentRecord: boolean
  invoices: {
    type: string
    status: string
    total_ghs: number
    installments?: { amount_ghs: number }[]
  }[]
}

export default function SendAdmissionLetterCard({
  applicationId,
  applicationStatus,
  enrolledAt,
  admissionLetterSentAt,
  admissionLetterR2Key,
  hasStudentRecord,
  invoices,
}: SendAdmissionLetterCardProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const { tuitionPaidGhs, tuitionInvoiceStatus } = sumTuitionPaidFromInvoices(invoices)
  const tuitionInvoice = invoices.find((inv) => inv.type === 'tuition')
  const effectiveTuitionPaid =
    tuitionPaidGhs > 0
      ? tuitionPaidGhs
      : tuitionInvoice?.status === 'paid'
        ? Number(tuitionInvoice.total_ghs ?? 0)
        : 0

  const lifecycle = deriveProgramLifecycleStatus({
    registeredAt: '',
    enrolledAt,
    tuitionPaidGhs: effectiveTuitionPaid,
    tuitionInvoiceStatus,
    hasStudentRecord,
  })

  const canSend =
    applicationStatus === 'accepted' &&
    effectiveTuitionPaid > 0 &&
    !pending

  function handleSend() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await sendAdmissionLetter(applicationId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setSuccess(
        result.enrolled
          ? 'Admission letter sent. This applicant is now enrolled for this programme.'
          : 'Admission letter sent.',
      )
    })
  }

  return (
    <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
      <h2 className="mb-1 font-body text-base font-semibold text-[#1A1A2E]">
        Admission letter &amp; enrolment
      </h2>
      <p className="mb-4 font-body text-sm text-[#9898B8]">
        Enrolment is confirmed only after at least one tuition payment and this PDF is
        emailed to the applicant.
      </p>

      <dl className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 font-body text-sm">
        <div>
          <dt className="text-[#9898B8]">Programme status</dt>
          <dd className="font-semibold capitalize text-[#1A1A2E]">
            {PROGRAM_STATUS_LABELS[lifecycle]}
          </dd>
        </div>
        <div>
          <dt className="text-[#9898B8]">Tuition paid to date</dt>
          <dd className="font-semibold text-[#1A1A2E]">
            GHS {effectiveTuitionPaid.toFixed(2)}
          </dd>
        </div>
        {enrolledAt && (
          <div>
            <dt className="text-[#9898B8]">Enrolled on</dt>
            <dd className="text-[#1A1A2E]">{formatApplicationDate(enrolledAt)}</dd>
          </div>
        )}
        {admissionLetterSentAt && (
          <div>
            <dt className="text-[#9898B8]">Letter last sent</dt>
            <dd className="text-[#1A1A2E]">
              {formatApplicationDate(admissionLetterSentAt)}
            </dd>
          </div>
        )}
      </dl>

      {applicationStatus !== 'accepted' && (
        <p className="mb-4 font-body text-sm text-[#C4701E]">
          Accept this application before sending an admission letter.
        </p>
      )}

      {applicationStatus === 'accepted' && effectiveTuitionPaid <= 0 && (
        <p className="mb-4 font-body text-sm text-[#C4701E]">
          Record at least one tuition payment before sending the admission letter.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canSend}
          onClick={handleSend}
          className="rounded-full bg-primary px-5 py-2 font-body text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending
            ? 'Sending…'
            : admissionLetterSentAt
              ? 'Resend admission letter'
              : 'Send admission letter (PDF)'}
        </button>
        {admissionLetterR2Key && (
          <ViewDocumentButton r2Key={admissionLetterR2Key} />
        )}
      </div>

      {error && <p className="mt-3 font-body text-sm text-[#E84A4A]">{error}</p>}
      {success && <p className="mt-3 font-body text-sm text-[#1E9990]">{success}</p>}
    </section>
  )
}
