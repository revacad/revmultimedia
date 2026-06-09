import Link from 'next/link'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import PortalProfilePhotoSection from '@/components/portal/PortalProfilePhotoSection'
import ApplicationStatusBadge from '@/components/admin/applications/ApplicationStatusBadge'
import PortalDocumentDownloadButton from '@/components/portal/PortalDocumentDownloadButton'
import ProfileDataComplianceSection from '@/components/portal/ProfileDataComplianceSection'
import DocumentTypeIcon from '@/components/portal/DocumentTypeIcon'
import {
  formatApplicationDate,
  formatDocumentType,
  formatGender,
  formatQualification,
  getCountryFlag,
} from '@/lib/applications/format'
import { formatCategory, formatMode } from '@/lib/courses/labels'
import type { ApplicationStatus } from '@/lib/applications/types'
import type { CourseCategory, CourseMode } from '@/lib/courses/types'
import { fetchStudentCertificates } from '@/lib/documents/fetch-student-certificates'
import { fetchStudentDocuments } from '@/lib/documents/fetch-student-documents'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const APPLICATION_DOC_TYPES = new Set([
  'national_id',
  'passport',
  'passport_photo',
  'certificate',
])

export default async function PortalProfilePage() {
  const user = await requirePortalUser()
  const supabase = await createServerClient()

  const { data: studentRows } = await supabase
    .from('students')
    .select('*')
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: true })

  const student =
    studentRows?.find((row) => row.profile_photo_r2_key) ?? studentRows?.[0] ?? null
  const hasStudentRecord = (studentRows?.length ?? 0) > 0

  const { data: applications } = await supabase
    .from('applications')
    .select(
      `
      id,
      reference,
      status,
      created_at,
      full_name,
      real_email,
      phone,
      date_of_birth,
      gender,
      country,
      address,
      state_region,
      city,
      qualification,
      institution,
      courses(title, category, mode),
      intakes(name, start_date)
    `,
    )
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: false })

  const primary = applications?.[0]
  const profileSource = student ?? primary

  if (!profileSource) {
    return (
      <p className="font-body text-sm text-[#9898B8]">
        No profile found.{' '}
        <Link href="/portal/dashboard" className="text-[#C74A86] hover:underline">
          Back to dashboard
        </Link>
      </p>
    )
  }

  const applicationIds = (applications ?? []).map((a) => a.id as string)
  const studentDbIds = (studentRows ?? []).map((row) => row.id as string)

  const [applicationDocuments, certificates] = await Promise.all([
    fetchStudentDocuments(supabase, {
      studentDbIds,
      applicationIds,
      documentTypes: [...APPLICATION_DOC_TYPES],
    }),
    fetchStudentCertificates(supabase, user.id),
  ])

  const { data: pendingDeletion } = await supabase
    .from('deletion_requests')
    .select('id')
    .eq('student_auth_user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E] sm:text-[28px]">
          Profile
        </h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          Your details, applications, and uploaded documents
        </p>
      </header>

      {hasStudentRecord && student ? (
        <PortalProfilePhotoSection
          studentDbId={student.id}
          fullName={student.full_name}
          currentPhotoKey={student.profile_photo_r2_key}
        />
      ) : (
        <section className="rounded-2xl bg-white p-8 text-center shadow-card">
          <div
            className="mx-auto flex h-28 w-28 items-center justify-center rounded-full font-body text-3xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #C74A86, #F18F3B)' }}
          >
            {profileSource.full_name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p: string) => p[0]?.toUpperCase())
              .join('')}
          </div>
          <p className="mt-4 font-body text-sm text-[#9898B8]">
            Profile photo upload is available after you are enrolled as a student.
          </p>
        </section>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-lg font-semibold text-[#1A1A2E]">
          Personal details
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="font-body text-xs text-[#9898B8]">Full name</dt>
            <dd className="font-body text-sm font-medium text-[#1A1A2E]">
              {profileSource.full_name}
            </dd>
          </div>
          <div>
            <dt className="font-body text-xs text-[#9898B8]">Email</dt>
            <dd className="font-body text-sm text-[#1A1A2E]">{profileSource.real_email}</dd>
          </div>
          <div>
            <dt className="font-body text-xs text-[#9898B8]">Phone</dt>
            <dd className="font-body text-sm text-[#1A1A2E]">{profileSource.phone}</dd>
          </div>
          <div>
            <dt className="font-body text-xs text-[#9898B8]">Date of birth</dt>
            <dd className="font-body text-sm text-[#1A1A2E]">
              {formatApplicationDate(profileSource.date_of_birth as string)}
            </dd>
          </div>
          <div>
            <dt className="font-body text-xs text-[#9898B8]">Gender</dt>
            <dd className="font-body text-sm text-[#1A1A2E]">
              {formatGender(profileSource.gender as string)}
            </dd>
          </div>
          <div>
            <dt className="font-body text-xs text-[#9898B8]">Country</dt>
            <dd className="font-body text-sm text-[#1A1A2E]">
              {getCountryFlag(profileSource.country as string)} {profileSource.country}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-body text-xs text-[#9898B8]">Address</dt>
            <dd className="font-body text-sm text-[#1A1A2E]">{profileSource.address}</dd>
          </div>
          {(profileSource.state_region || profileSource.city) && (
            <div className="sm:col-span-2">
              <dt className="font-body text-xs text-[#9898B8]">Region / city</dt>
              <dd className="font-body text-sm text-[#1A1A2E]">
                {[profileSource.state_region, profileSource.city].filter(Boolean).join(' · ')}
              </dd>
            </div>
          )}
          {primary?.qualification && (
            <div>
              <dt className="font-body text-xs text-[#9898B8]">Qualification</dt>
              <dd className="font-body text-sm text-[#1A1A2E]">
                {formatQualification(primary.qualification as string)}
              </dd>
            </div>
          )}
        </dl>
        <p className="mt-5 font-body text-sm text-[#5A5A7A]">
          To update your details contact us on{' '}
          <a
            href="https://wa.me/233204543372"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#1E9990] hover:underline"
          >
            WhatsApp
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-body text-lg font-semibold text-[#1A1A2E]">
          Application summary
        </h2>
        <div className="space-y-4">
          {(applications ?? []).length === 0 ? (
            <p className="rounded-2xl bg-white p-6 font-body text-sm text-[#9898B8] shadow-card">
              No applications on file.
            </p>
          ) : (
            (applications ?? []).map((app) => {
              const course = Array.isArray(app.courses)
                ? app.courses[0]
                : (app.courses as {
                    title: string
                    category: CourseCategory
                    mode: CourseMode
                  } | null)
              const intake = Array.isArray(app.intakes)
                ? app.intakes[0]
                : (app.intakes as { name: string; start_date: string } | null)

              return (
                <article
                  key={app.id as string}
                  className="rounded-2xl bg-white p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-[#C74A86]">
                        {app.reference as string}
                      </p>
                      <p className="mt-1 font-display text-lg font-semibold text-[#1A1A2E]">
                        {course?.title ?? 'Course'}
                      </p>
                    </div>
                    <ApplicationStatusBadge status={app.status as ApplicationStatus} />
                  </div>
                  {course && (
                    <p className="mt-2 font-body text-xs text-[#9898B8]">
                      {formatCategory(course.category)} · {formatMode(course.mode)}
                    </p>
                  )}
                  {intake && (
                    <p className="mt-1 font-body text-sm text-[#5A5A7A]">
                      {intake.name} · starts {formatApplicationDate(intake.start_date)}
                    </p>
                  )}
                  <p className="mt-2 font-body text-xs text-[#9898B8]">
                    Submitted {formatApplicationDate(app.created_at as string)}
                  </p>
                </article>
              )
            })
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-body text-lg font-semibold text-[#1A1A2E]">Documents</h2>
        {applicationDocuments.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 font-body text-sm text-[#9898B8] shadow-card">
            No application documents uploaded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {applicationDocuments.map((doc) => (
              <article
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-card"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <DocumentTypeIcon type={doc.document_type} />
                  <div className="min-w-0">
                    <p className="font-body text-[15px] font-semibold text-[#1A1A2E]">
                      {formatDocumentType(doc.document_type)}
                    </p>
                    <p className="truncate font-body text-[13px] text-[#9898B8]">
                      {doc.file_name}
                    </p>
                    {doc.uploaded_at && (
                      <p className="font-body text-xs text-[#9898B8]">
                        {formatApplicationDate(doc.uploaded_at)}
                      </p>
                    )}
                  </div>
                </div>
                <PortalDocumentDownloadButton r2Key={doc.r2_key} />
              </article>
            ))}
          </div>
        )}
      </section>

      {certificates.length > 0 && (
        <section>
          <h2 className="mb-4 font-body text-lg font-semibold text-[#1A1A2E]">
            Certificates
          </h2>
          <div className="space-y-3">
            {certificates.map((cert) => (
              <article
                key={cert.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-card"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2DBFB818]">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="#2DBFB8"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="font-body text-[15px] font-semibold text-[#1A1A2E]">
                      {cert.courseTitle ?? 'Course certificate'}
                    </p>
                    {cert.uploadedAt && (
                      <p className="font-body text-xs text-[#9898B8]">
                        {formatApplicationDate(cert.uploadedAt)}
                      </p>
                    )}
                  </div>
                </div>
                <PortalDocumentDownloadButton r2Key={cert.r2Key} />
              </article>
            ))}
          </div>
        </section>
      )}

      <ProfileDataComplianceSection
        hasPendingDeletionRequest={Boolean(pendingDeletion)}
      />
    </div>
  )
}
