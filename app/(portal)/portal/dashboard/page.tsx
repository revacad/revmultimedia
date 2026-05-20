import { redirect } from 'next/navigation'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import Badge from '@/components/ui/Badge'
import ReferenceCode from '@/components/ui/ReferenceCode'
import CertificateDownloadButton from '@/components/portal/CertificateDownloadButton'
import ProfilePhotoUpload from '@/components/portal/ProfilePhotoUpload'
import PaymentInstructions from '@/components/portal/PaymentInstructions'
import InvoiceStatusBadge from '@/components/admin/payments/InvoiceStatusBadge'
import { formatApplicationDate } from '@/lib/applications/format'
import { getPaymentSettings } from '@/lib/portal/settings'
import { firstName } from '@/lib/portal/timeline'
import { formatCategory, formatMode } from '@/lib/courses/labels'
import type { CourseCategory, CourseMode } from '@/lib/courses/types'
import type { InvoiceStatus } from '@/lib/payments/types'
import { createServerClient } from '@/lib/supabase/server'
import { formatGHS } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  deferred: 'Deferred',
  withdrawn: 'Withdrawn',
}

const ENROLLMENT_STATUS_CLASS: Record<string, string> = {
  active: 'bg-[#EBF9F8] text-[#1E9990]',
  completed: 'bg-[#F0F0F8] text-[#5A5A7A]',
  deferred: 'bg-[#FEF6EE] text-[#C4701E]',
  withdrawn: 'bg-[#FDECEC] text-[#E84A4A]',
}

const INVOICE_TYPE_LABELS: Record<string, string> = {
  application_fee: 'Application Fee',
  tuition: 'Tuition',
}

export default async function StudentDashboardPage() {
  const user = await requirePortalUser()
  const supabase = await createServerClient()

  const { data: student } = await supabase
    .from('students')
    .select(
      `
      *,
      enrollments(
        *,
        courses(title, category, mode),
        intakes(name, start_date, end_date)
      )
    `,
    )
    .eq('auth_user_id', user.id)
    .single()

  if (!student) redirect('/portal/application')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, installments(*)')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('student_id', student.id)

  const settings = await getPaymentSettings()
  const enrollments = (student.enrollments ?? []) as {
    id: string
    status: string
    courses: { title: string; category: CourseCategory; mode: CourseMode } | null
    intakes: { name: string; start_date: string; end_date: string } | null
  }[]

  const certByEnrollment = new Map(
    (certificates ?? []).map((c) => [c.enrollment_id as string, c.r2_key as string]),
  )

  return (
    <div className="mx-auto max-w-[860px] px-0 py-4 sm:px-6 sm:py-8">
      <section className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1A1A2E] sm:text-[28px]">
            Welcome back, {firstName(student.full_name)}
          </h1>
          <p className="mt-1 font-body text-[15px] text-[#9898B8]">
            You are enrolled at Rev Multimedia Academy
          </p>
        </div>
        <div className="text-left sm:text-right [&_.font-mono]:text-sm sm:[&_.font-mono]:text-base">
          <ReferenceCode
            code={student.student_id}
            theme="light"
            large
            label="Your permanent student ID"
          />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-4 font-body text-lg font-semibold text-[#1A1A2E]">Your Courses</h2>
        {enrollments.length === 0 ? (
          <p className="font-body text-sm text-[#9898B8]">No enrollments yet.</p>
        ) : (
          enrollments.map((enrollment) => {
            const course = enrollment.courses
            const intake = enrollment.intakes
            const certKey = certByEnrollment.get(enrollment.id)

            return (
              <article
                key={enrollment.id}
                className="mb-4 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-card sm:flex-row sm:items-center"
              >
                <div className="sm:w-[60%]">
                  <p className="font-display text-xl font-semibold text-[#1A1A2E]">
                    {course?.title ?? 'Course'}
                  </p>
                  {course && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={course.category}>{formatCategory(course.category)}</Badge>
                      <Badge variant={course.mode}>{formatMode(course.mode)}</Badge>
                    </div>
                  )}
                  {intake && (
                    <p className="mt-2 font-body text-sm text-[#5A5A7A]">
                      {intake.name} · {formatApplicationDate(intake.start_date)} →{' '}
                      {formatApplicationDate(intake.end_date)}
                    </p>
                  )}
                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 font-body text-xs font-semibold ${
                      ENROLLMENT_STATUS_CLASS[enrollment.status] ?? ENROLLMENT_STATUS_CLASS.active
                    }`}
                  >
                    {ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status}
                  </span>
                </div>
                <div className="sm:w-[40%] sm:text-right">
                  {certKey ? (
                    <CertificateDownloadButton r2Key={certKey} />
                  ) : (
                    <p className="font-body text-sm text-[#9898B8]">Certificate not yet available</p>
                  )}
                </div>
              </article>
            )
          })
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-4 font-body text-lg font-semibold text-[#1A1A2E]">Payment History</h2>
        {(invoices ?? []).length === 0 ? (
          <p className="font-body text-sm text-[#9898B8]">No invoices yet.</p>
        ) : (
          (invoices ?? []).map((invoice) => {
            const installments = (invoice.installments as { amount_ghs: number }[]) ?? []
            const paidAmount = installments.reduce((sum, row) => sum + Number(row.amount_ghs), 0)
            const total = Number(invoice.total_ghs ?? invoice.amount_ghs)
            const progress = total > 0 ? Math.min(100, (paidAmount / total) * 100) : 0
            const status = invoice.status as InvoiceStatus

            return (
              <article key={invoice.id} className="mb-4 rounded-xl bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-medium text-[#C74A86]">{invoice.reference}</p>
                    <p className="mt-1 font-body text-sm text-[#1A1A2E]">{formatGHS(total)}</p>
                    <p className="mt-1 font-body text-xs text-[#9898B8]">
                      {invoice.created_at
                        ? formatApplicationDate(invoice.created_at)
                        : '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#F0F0F8] px-3 py-1 font-body text-xs font-semibold text-[#5A5A7A]">
                      {INVOICE_TYPE_LABELS[invoice.type] ?? invoice.type}
                    </span>
                    <InvoiceStatusBadge status={status} />
                  </div>
                </div>
                {status === 'partially_paid' && (
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-[#EFEFF5]">
                      <div
                        className="h-full rounded-full bg-[#C74A86]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 font-body text-xs text-[#9898B8]">
                      {formatGHS(paidAmount)} of {formatGHS(total)} paid
                    </p>
                  </div>
                )}
                {invoice.type === 'tuition' && status === 'unpaid' && (
                  <PaymentInstructions settings={settings} invoiceReference={invoice.reference} />
                )}
              </article>
            )
          })
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Profile</h2>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <ProfilePhotoUpload
            studentDbId={student.id}
            fullName={student.full_name}
            currentPhotoKey={student.profile_photo_r2_key}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-display text-xl font-semibold text-[#1A1A2E]">{student.full_name}</p>
            <p className="font-body text-sm text-[#5A5A7A]">{student.real_email}</p>
            <p className="font-body text-sm text-[#5A5A7A]">{student.phone}</p>
            <p className="font-body text-sm text-[#5A5A7A]">
              {student.country}
              {student.state_region ? ` · ${student.state_region}` : ''}
            </p>
            <p className="font-mono text-sm font-semibold text-[#C74A86]">{student.student_id}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
