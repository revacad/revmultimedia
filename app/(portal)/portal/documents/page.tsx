import { redirect } from 'next/navigation'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import PortalDocumentUpload from '@/components/portal/PortalDocumentUpload'
import DocumentTypeIcon from '@/components/portal/DocumentTypeIcon'
import PortalDocumentDownloadButton from '@/components/portal/PortalDocumentDownloadButton'
import { formatApplicationDate, formatDocumentType } from '@/lib/applications/format'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function PortalDocumentsPage() {
  const user = await requirePortalUser()
  const supabase = await createServerClient()

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  const { data: application } = await supabase
    .from('applications')
    .select('id, reference')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!student && !application) redirect('/login')

  let documentsQuery = supabase.from('documents').select('*').order('uploaded_at', { ascending: false })

  if (student?.id && application?.id) {
    documentsQuery = documentsQuery.or(
      `student_id.eq.${student.id},application_id.eq.${application.id}`,
    )
  } else if (student?.id) {
    documentsQuery = documentsQuery.eq('student_id', student.id)
  } else if (application?.id) {
    documentsQuery = documentsQuery.eq('application_id', application.id)
  }

  const { data: documents } = await documentsQuery

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-[#1A1A2E]">My Documents</h1>
        <p className="mt-1 font-body text-[15px] text-[#9898B8]">
          Documents you have submitted and uploaded
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-4">
        {(documents ?? []).length === 0 ? (
          <p className="rounded-xl bg-white p-6 font-body text-sm text-[#9898B8] shadow-card">
            No documents yet.
          </p>
        ) : (
          (documents ?? []).map((doc) => (
            <article
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-card"
            >
              <div className="flex min-w-0 items-center gap-4">
                <DocumentTypeIcon type={doc.document_type} />
                <div className="min-w-0">
                  <p className="font-body text-[15px] font-semibold text-[#1A1A2E]">
                    {formatDocumentType(doc.document_type)}
                  </p>
                  <p className="truncate font-body text-[13px] text-[#9898B8]">{doc.file_name}</p>
                  {doc.uploaded_at && (
                    <p className="font-body text-xs text-[#9898B8]">
                      {formatApplicationDate(doc.uploaded_at)}
                    </p>
                  )}
                </div>
              </div>
              <PortalDocumentDownloadButton r2Key={doc.r2_key} />
            </article>
          ))
        )}
      </div>

      {student?.id && <PortalDocumentUpload studentDbId={student.id} />}
    </div>
  )
}
