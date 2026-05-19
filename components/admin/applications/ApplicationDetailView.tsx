import type { ReactNode } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import ReferenceCode from '@/components/ui/ReferenceCode'
import ApplicationStatusBadge from '@/components/admin/applications/ApplicationStatusBadge'
import AdminNotesSection from '@/components/admin/applications/AdminNotesSection'
import StatusActionButtons from '@/components/admin/applications/StatusActionButtons'
import ViewDocumentButton from '@/components/admin/applications/ViewDocumentButton'
import {
  daysSince,
  formatApplicationDate,
  formatDocumentType,
  formatGender,
  formatQualification,
  getCountryFlag,
  getInitials,
} from '@/lib/applications/format'
import type { ApplicationDetail } from '@/lib/applications/types'
import { formatCategory, formatMode } from '@/lib/courses/labels'
import { formatGHS } from '@/lib/utils'

interface ApplicationDetailViewProps {
  application: ApplicationDetail
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-body text-xs font-semibold uppercase tracking-[0.06em] text-[#9898B8]">
        {label}
      </p>
      <p className="mt-1 font-body text-[15px] text-[#1A1A2E]">{value}</p>
    </div>
  )
}

function Card({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-body text-base font-semibold text-[#1A1A2E]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function ApplicationDetailView({ application }: ApplicationDetailViewProps) {
  const course = application.courses
  const intake = application.intakes
  const documents = application.documents ?? []
  const notes = [...(application.admin_notes ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  const appFeeInvoice = (application.invoices ?? []).find(
    (inv) => inv.type === 'application_fee',
  )
  const regionCity = [application.state_region, application.city].filter(Boolean).join(', ')

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/admin/applications"
        className="mb-6 inline-block font-body text-sm text-[#9898B8] hover:text-[#1A1A2E]"
      >
        ← All Applications
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,65%)_minmax(0,35%)]">
        <div>
          <section className="mb-6 flex items-center gap-4 rounded-xl bg-white p-6 shadow-card">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #C74A86, #F18F3B)' }}
            >
              <span className="font-body text-xl font-bold">
                {getInitials(application.full_name)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[22px] font-semibold text-[#1A1A2E]">
                {application.full_name}
              </h1>
              <p className="mt-1 font-mono text-[13px] text-[#C74A86]">{application.reference}</p>
              <p className="mt-1 font-body text-[13px] text-[#9898B8]">
                Submitted {formatApplicationDate(application.created_at)}
              </p>
            </div>
            <ApplicationStatusBadge status={application.status} className="ml-auto shrink-0" />
          </section>

          <Card title="Personal Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Full Name" value={application.full_name} />
              <DetailField
                label="Date of Birth"
                value={formatApplicationDate(application.date_of_birth)}
              />
              <DetailField label="Gender" value={formatGender(application.gender)} />
              <DetailField
                label="Country"
                value={`${getCountryFlag(application.country)} ${application.country}`}
              />
              <DetailField label="Phone" value={application.phone} />
              <DetailField label="Email" value={application.real_email} />
              <DetailField label="Address" value={application.address} />
              {regionCity && <DetailField label="Region / City" value={regionCity} />}
            </div>
          </Card>

          <Card
            title="Course Selection"
            action={
              course ? (
                <Badge variant={course.mode}>{formatMode(course.mode)}</Badge>
              ) : undefined
            }
          >
            {course ? (
              <>
                <p className="font-display text-xl font-semibold text-[#1A1A2E]">{course.title}</p>
                <div className="mt-2">
                  <Badge variant={course.category}>{formatCategory(course.category)}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField
                    label="Intake"
                    value={
                      intake
                        ? `${intake.name} · ${formatApplicationDate(intake.start_date)}`
                        : '—'
                    }
                  />
                  <DetailField label="Tuition fee" value={formatGHS(Number(course.tuition_fee_ghs))} />
                  <DetailField
                    label="Slots"
                    value={
                      intake
                        ? `${intake.enrolled_count ?? 0}/${intake.max_slots ?? '—'}`
                        : '—'
                    }
                  />
                  <DetailField
                    label="Hybrid confirmed"
                    value={application.hybrid_attendance_confirmed ? 'Yes' : 'No'}
                  />
                </div>
              </>
            ) : (
              <p className="font-body text-sm text-[#9898B8]">Course not found</p>
            )}
          </Card>

          <Card title="Educational Background">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField
                label="Qualification"
                value={formatQualification(application.qualification)}
              />
              <DetailField label="Institution" value={application.institution} />
              <DetailField
                label="Year Completed"
                value={String(application.year_completed)}
              />
            </div>
            {application.prior_experience && (
              <div className="mt-4">
                <DetailField label="Prior Experience" value={application.prior_experience} />
              </div>
            )}
          </Card>

          <Card title="Submitted Documents">
            {documents.length === 0 ? (
              <p className="font-body text-sm text-[#9898B8]">No documents uploaded.</p>
            ) : (
              <ul>
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-4 border-b border-[#EFEFF5] py-3 last:border-0"
                  >
                    <div>
                      <p className="font-body text-sm font-medium text-[#1A1A2E]">
                        {formatDocumentType(doc.document_type)}
                      </p>
                      <p className="font-body text-sm text-[#9898B8]">{doc.file_name}</p>
                    </div>
                    <ViewDocumentButton r2Key={doc.r2_key} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <AdminNotesSection applicationId={application.id} notes={notes} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-xl bg-white p-6 shadow-card">
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
              Current Status
            </p>
            <div className="mt-3">
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="mt-3 font-body text-xs text-[#9898B8]">
              Last updated {formatApplicationDate(application.updated_at)}
            </p>

            <p className="mb-3 mt-6 font-body text-[13px] font-semibold text-[#5A5A7A]">
              Change Status
            </p>
            <StatusActionButtons applicationId={application.id} />
          </section>

          <section className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
              Application Fee Invoice
            </h2>
            {appFeeInvoice ? (
              <div className="space-y-2">
                <p className="font-mono text-[13px] text-[#C74A86]">{appFeeInvoice.reference}</p>
                <p className="font-body text-sm text-[#1A1A2E]">
                  {formatGHS(Number(appFeeInvoice.total_ghs))}
                </p>
                <span
                  className={
                    appFeeInvoice.status === 'paid'
                      ? 'inline-flex rounded-full bg-[#EBF9F8] px-3 py-1 font-body text-xs font-semibold text-[#1E9990]'
                      : 'inline-flex rounded-full bg-[#FDECEC] px-3 py-1 font-body text-xs font-semibold text-[#E84A4A]'
                  }
                >
                  {appFeeInvoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            ) : (
              <p className="font-body text-sm text-[#9898B8]">No invoice generated yet</p>
            )}

            {application.status === 'accepted' && (
              <Link
                href={`/admin/applications/${application.id}/invoice/new`}
                className="mt-4 flex w-full items-center justify-center rounded-full bg-primary px-5 py-2.5 font-body text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Generate Tuition Invoice
              </Link>
            )}
          </section>

          <section className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Quick info</h2>
            <ReferenceCode code={application.reference} label="Application reference" />
            <p className="mt-4 font-body text-sm text-[#5A5A7A]">
              <span className="text-[#9898B8]">Days since applied:</span>{' '}
              {daysSince(application.created_at)}
            </p>
            <p className="mt-2 font-body text-sm text-[#5A5A7A]">
              <span className="text-[#9898B8]">App fee:</span>{' '}
              {application.app_fee_paid ? (
                <span className="font-semibold text-[#1E9990]">Paid</span>
              ) : (
                <span className="font-semibold text-[#E84A4A]">Unpaid</span>
              )}
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
