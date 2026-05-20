import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import CertificateUploadSlot from '@/components/admin/students/CertificateUploadSlot'
import ViewDocumentButton from '@/components/admin/applications/ViewDocumentButton'
import {
  formatApplicationDate,
  formatDocumentType,
  getCountryFlag,
} from '@/lib/applications/format'
import { formatCategory } from '@/lib/courses/labels'
import type { CourseCategory } from '@/lib/courses/types'
import { formatGHS } from '@/lib/utils'
import AdminStudentAvatar from '@/components/admin/students/AdminStudentAvatar'
import ApplicationStatusBadge from '@/components/admin/applications/ApplicationStatusBadge'
import NotificationHistoryCard, {
  type NotificationLogRow,
} from '@/components/admin/students/NotificationHistoryCard'
import type { ApplicationStatus } from '@/lib/applications/types'
import CommunicationHistoryCard, {
  type CommunicationLogHistoryRow,
} from '@/components/admin/students/CommunicationHistoryCard'
import SendDirectMessageCard from '@/components/admin/students/SendDirectMessageCard'

export type AdminStudentDetail = {
  id: string
  student_id: string
  full_name: string
  real_email: string
  phone: string
  country: string
  created_at: string
  profile_photo_r2_key: string | null
  application_id: string
  enrollments: {
    id: string
    status: string
    courses: { id: string; title: string; slug: string; category: CourseCategory } | null
    intakes: { name: string; start_date: string; end_date: string } | null
  }[]
  certificates: {
    id: string
    enrollment_id: string
    r2_key: string
    file_name: string
    uploaded_at: string
  }[]
  invoices: {
    id: string
    type: string
    status: string
    total_ghs: number
    amount_ghs: number
  }[]
  documents: {
    id: string
    document_type: string
    file_name: string
    r2_key: string
  }[]
  applications: { reference: string } | null
  allApplications: {
    id: string
    reference: string
    status: ApplicationStatus
    created_at: string
    courses: { title: string } | null
  }[]
  notifications: NotificationLogRow[]
  communicationLogs: CommunicationLogHistoryRow[]
}

const ENROLLMENT_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  deferred: 'Deferred',
  withdrawn: 'Withdrawn',
}

export default function StudentDetailView({ student }: { student: AdminStudentDetail }) {
  const certByEnrollment = new Map(
    student.certificates.map((c) => [c.enrollment_id, c]),
  )

  const tuitionInvoices = student.invoices.filter((i) => i.type === 'tuition')
  const paidTuition = tuitionInvoices.filter((i) => i.status === 'paid')
  const totalPaid = paidTuition.reduce(
    (sum, inv) => sum + Number(inv.total_ghs ?? inv.amount_ghs),
    0,
  )

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/admin/students"
        className="mb-6 inline-block font-body text-sm text-[#9898B8] hover:text-[#1A1A2E]"
      >
        ← All Students
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,65%)_minmax(0,35%)]">
        <div>
          <section className="mb-6 flex items-center gap-4 rounded-xl bg-white p-6 shadow-card">
            <AdminStudentAvatar
              fullName={student.full_name}
              photoKey={student.profile_photo_r2_key}
            />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-lg font-semibold text-primary">{student.student_id}</p>
              <h1 className="font-display text-[22px] font-semibold text-[#1A1A2E]">
                {student.full_name}
              </h1>
              <p className="mt-1 font-body text-sm text-[#9898B8]">{student.real_email}</p>
              <p className="font-body text-sm text-[#9898B8]">{student.phone}</p>
              <p className="font-body text-sm text-[#9898B8]">
                {getCountryFlag(student.country)} {student.country}
              </p>
            </div>
          </section>

          <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Enrollments</h2>
            {student.enrollments.length === 0 ? (
              <p className="font-body text-sm text-[#9898B8]">No enrollments.</p>
            ) : (
              student.enrollments.map((enrollment) => {
                const course = enrollment.courses
                const intake = enrollment.intakes
                const cert = certByEnrollment.get(enrollment.id)

                return (
                  <article
                    key={enrollment.id}
                    className="mb-4 border-b border-[#EFEFF5] pb-4 last:mb-0 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-lg font-semibold text-[#1A1A2E]">
                          {course?.title ?? 'Course'}
                        </p>
                        {course && (
                          <Badge variant={course.category} className="mt-2">
                            {formatCategory(course.category)}
                          </Badge>
                        )}
                        {intake && (
                          <p className="mt-2 font-body text-sm text-[#5A5A7A]">
                            {intake.name} · {formatApplicationDate(intake.start_date)} →{' '}
                            {formatApplicationDate(intake.end_date)}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-[#F0F0F8] px-3 py-1 font-body text-xs font-semibold text-[#5A5A7A]">
                        {ENROLLMENT_LABELS[enrollment.status] ?? enrollment.status}
                      </span>
                    </div>

                    <p className="mt-3 font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
                      Certificate
                    </p>
                    {course && (
                      <CertificateUploadSlot
                        studentDbId={student.id}
                        studentPublicId={student.student_id}
                        enrollmentId={enrollment.id}
                        courseId={course.id}
                        courseSlug={course.slug}
                        existing={
                          cert
                            ? {
                                fileName: cert.file_name,
                                uploadedAt: cert.uploaded_at,
                                r2Key: cert.r2_key,
                              }
                            : undefined
                        }
                      />
                    )}
                  </article>
                )
              })
            )}
          </section>

          <section className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Documents</h2>
            {student.documents.length === 0 ? (
              <p className="font-body text-sm text-[#9898B8]">No documents.</p>
            ) : (
              <ul className="space-y-3">
                {student.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEFF5] pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-body text-sm font-medium text-[#1A1A2E]">
                        {formatDocumentType(doc.document_type)}
                      </p>
                      <p className="font-body text-xs text-[#9898B8]">{doc.file_name}</p>
                    </div>
                    <ViewDocumentButton r2Key={doc.r2_key} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <NotificationHistoryCard notifications={student.notifications} />
          <CommunicationHistoryCard logs={student.communicationLogs} />
        </div>

        <div>
          <SendDirectMessageCard studentId={student.id} />
          <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Quick info</h2>
            <dl className="space-y-3 font-body text-sm">
              <div>
                <dt className="text-[#9898B8]">Student ID</dt>
                <dd className="font-mono text-primary">{student.student_id}</dd>
              </div>
              <div>
                <dt className="text-[#9898B8]">Enrolled</dt>
                <dd className="text-[#1A1A2E]">{formatApplicationDate(student.created_at)}</dd>
              </div>
              <div>
                <dt className="text-[#9898B8]">Country</dt>
                <dd className="text-[#1A1A2E]">{student.country}</dd>
              </div>
              <div>
                <dt className="mb-2 text-[#9898B8]">Applications</dt>
                <dd>
                  {student.allApplications.length === 0 ? (
                    <span className="text-[#9898B8]">None</span>
                  ) : (
                    <ul className="space-y-2">
                      {student.allApplications.map((app) => (
                        <li
                          key={app.id}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="font-mono text-sm text-primary hover:underline"
                          >
                            {app.reference}
                          </Link>
                          <span className="font-body text-xs text-[#9898B8]">
                            → {app.courses?.title ?? 'Course'}
                          </span>
                          <ApplicationStatusBadge status={app.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                  {student.allApplications.length > 1 && (
                    <p className="mt-2 font-body text-xs text-[#9898B8]">
                      Returning students may have one application per course or intake.
                    </p>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
              Payment summary
            </h2>
            <p className="font-body text-sm text-[#5A5A7A]">
              Tuition invoices: {tuitionInvoices.length} · Paid: {paidTuition.length}
            </p>
            <p className="mt-2 font-body text-sm font-semibold text-[#1A1A2E]">
              Amount paid: {formatGHS(totalPaid)}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
