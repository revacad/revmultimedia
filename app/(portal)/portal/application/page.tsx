import { redirect } from 'next/navigation'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import { getPortalAccess } from '@/lib/portal/access'
import Badge from '@/components/ui/Badge'
import ReferenceCode from '@/components/ui/ReferenceCode'
import ApplicationTimeline from '@/components/portal/ApplicationTimeline'
import DocumentDownloadLink from '@/components/portal/DocumentDownloadLink'
import PaymentInstructions from '@/components/portal/PaymentInstructions'
import { AppFeeGate } from '@/components/portal/AppFeeGate'
import { PaystackButton } from '@/components/portal/PaystackButton'
import InvoiceStatusBadge from '@/components/admin/payments/InvoiceStatusBadge'
import { formatApplicationDate, formatDocumentType } from '@/lib/applications/format'
import { getPaymentSettings } from '@/lib/portal/settings'
import { firstName, resolveTimelineActiveStep } from '@/lib/portal/timeline'
import { formatCategory, formatMode } from '@/lib/courses/labels'
import type { CourseCategory, CourseMode } from '@/lib/courses/types'
import type { InvoiceStatus } from '@/lib/payments/types'
import { createServerClient } from '@/lib/supabase/server'
import { formatGHS } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ApplicantDashboardPage() {
  await requirePortalUser()
  const access = await getPortalAccess()

  if (!access || access.type === 'student') {
    if (access?.type === 'student') redirect('/portal/dashboard')
    redirect('/login')
  }

  const supabase = await createServerClient()

  const { data: application } = await supabase
    .from('applications')
    .select(
      `
      *,
      courses(title, category, mode, tuition_fee_ghs),
      intakes(name, start_date, end_date),
      invoices(*),
      documents(*)
    `,
    )
    .eq('auth_user_id', access.userId)
    .single()

  if (!application) redirect('/login')

  const invoices = (application.invoices as {
    id: string
    reference: string
    type: string
    amount_ghs: number
    total_ghs: number
    status: InvoiceStatus
  }[]) ?? []

  const documents = (application.documents as {
    id: string
    document_type: string
    r2_key: string
    file_name: string
  }[]) ?? []

  const course = application.courses as {
    title: string
    category: CourseCategory
    mode: CourseMode
    tuition_fee_ghs: number
  } | null

  const intake = application.intakes as {
    name: string
    start_date: string
    end_date: string
  } | null

  const appFeeInvoice = invoices.find((inv) => inv.type === 'application_fee')
  const tuitionInvoice = invoices.find((inv) => inv.type === 'tuition')
  const tuitionPaid = tuitionInvoice?.status === 'paid'
  const settings = await getPaymentSettings()

  const activeStep = resolveTimelineActiveStep(application.status, {
    hasStudent: false,
    tuitionPaid,
  })

  const appFeeAmount =
    access.appFeeAmount ??
    Number(appFeeInvoice?.total_ghs ?? appFeeInvoice?.amount_ghs ?? 100)

  const gateProps = {
    appFeePaid: access.appFeePaid,
    invoiceRef: access.invoiceRef ?? appFeeInvoice?.reference,
    appFeeAmount,
    applicationRef: access.applicationRef ?? application.reference,
    payerEmail: access.payerEmail ?? application.real_email,
  }

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">
      <section className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A2E]">
            Hello, {firstName(application.full_name)}
          </h1>
          <p className="mt-1 font-body text-[15px] text-[#9898B8]">Here is your application status</p>
        </div>
        <ReferenceCode code={application.reference} theme="light" label="Application reference" />
      </section>

      {!access.appFeePaid && (
        <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
          <AppFeeGate {...gateProps}>
            <span className="sr-only">Pay application fee</span>
          </AppFeeGate>
        </section>
      )}

      <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Application Status</h2>
        <ApplicationTimeline activeStep={activeStep} />
      </section>

      <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Your Course</h2>
        {course ? (
          <>
            <p className="font-display text-[22px] font-semibold text-[#1A1A2E]">{course.title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={course.category}>{formatCategory(course.category)}</Badge>
              <Badge variant={course.mode}>{formatMode(course.mode)}</Badge>
            </div>
            {intake && (
              <p className="mt-3 font-body text-sm text-[#5A5A7A]">
                Intake: {intake.name} · starts {formatApplicationDate(intake.start_date)}
              </p>
            )}
            <p className="mt-2 font-body text-sm font-semibold text-[#1A1A2E]">
              Tuition fee: {formatGHS(Number(course.tuition_fee_ghs))}
            </p>
          </>
        ) : (
          <p className="font-body text-sm text-[#9898B8]">Course details unavailable</p>
        )}
      </section>

      <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Fees and Payments</h2>

        <div className="border-b border-[#EFEFF5] pb-5">
          <p className="font-body text-sm font-semibold text-[#5A5A7A]">Application fee</p>
          {appFeeInvoice ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-medium text-[#C74A86]">{appFeeInvoice.reference}</p>
                <p className="font-body text-sm text-[#1A1A2E]">{formatGHS(appFeeAmount)}</p>
              </div>
              <InvoiceStatusBadge status={appFeeInvoice.status} />
            </div>
          ) : (
            <p className="mt-2 font-body text-sm text-[#9898B8]">{formatGHS(appFeeAmount)}</p>
          )}
          {appFeeInvoice?.status === 'unpaid' && gateProps.payerEmail && (
            <div className="mt-4">
              <PaystackButton
                applicationRef={gateProps.applicationRef ?? ''}
                invoiceRef={gateProps.invoiceRef ?? appFeeInvoice.reference}
                amount={Math.round(appFeeAmount * 100)}
                email={gateProps.payerEmail}
              />
            </div>
          )}
        </div>

        {tuitionInvoice && (
          <AppFeeGate {...gateProps}>
            <div className="pt-5">
              <p className="font-body text-sm font-semibold text-[#5A5A7A]">Tuition</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-medium text-[#C74A86]">{tuitionInvoice.reference}</p>
                  <p className="font-body text-sm text-[#1A1A2E]">
                    {formatGHS(Number(tuitionInvoice.total_ghs ?? tuitionInvoice.amount_ghs))}
                  </p>
                </div>
                <InvoiceStatusBadge status={tuitionInvoice.status} />
              </div>
              {tuitionInvoice.status === 'unpaid' && (
                <PaymentInstructions settings={settings} invoiceReference={tuitionInvoice.reference} />
              )}
              {tuitionInvoice.status === 'paid' && (
                <p className="mt-3 flex items-center gap-2 font-body text-sm font-semibold text-[#1E9990]">
                  <span aria-hidden>✓</span> Payment confirmed
                </p>
              )}
            </div>
          </AppFeeGate>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Submitted Documents</h2>
        <AppFeeGate {...gateProps}>
          {documents.length === 0 ? (
            <p className="font-body text-sm text-[#9898B8]">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEFF5] pb-3 last:border-0 last:pb-0"
                >
                  <span className="font-body text-sm text-[#1A1A2E]">
                    {formatDocumentType(doc.document_type)}
                  </span>
                  <DocumentDownloadLink r2Key={doc.r2_key} fileName={doc.file_name} />
                </li>
              ))}
            </ul>
          )}
        </AppFeeGate>
      </section>
    </div>
  )
}
