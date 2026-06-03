'use server'

import { safeActionError } from '@/lib/errors/action'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaffAdmin } from '@/lib/auth/admin'
import { generateAndStoreAdmissionLetterPdf } from '@/lib/pdf/generate'
import { sendAdmissionLetterEmail } from '@/lib/notifications/email'
import { logAuditEvent } from '@/lib/audit/log'
import { logNotification } from '@/lib/notifications/log-delivery'
import {
  deriveProgramLifecycleStatus,
  sumTuitionPaidFromInvoices,
} from '@/lib/enrollment/program-status'
import { ensureStudentRecordForApplication } from '@/lib/enrollment/ensure-student-record'
import { generatePresignedDownloadUrl } from '@/lib/r2/presign'
import { sendAdmissionLetterSchema } from '@/lib/validations/admission-letter'

const ADMISSION_LETTER_EMAIL_URL_TTL_SECONDS = 604800 // 7 days

export async function sendAdmissionLetter(
  applicationId: string,
): Promise<{ success: true; enrolled: boolean } | { error: string }> {
  const parsed = sendAdmissionLetterSchema.safeParse({ applicationId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid request' }
  }

  const session = await requireStaffAdmin().catch(() => null)
  if (!session) {
    return { error: 'Not an admin' }
  }

  const supabase = createAdminClient()

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('auth_user_id', session.userId)
    .single()

  if (!admin) {
    return { error: 'Not an admin' }
  }

  const { data: application } = await supabase
    .from('applications')
    .select(
      `
      id, reference, full_name, real_email, status, enrolled_at,
      courses(title),
      invoices(type, status, total_ghs, installments(amount_ghs))
    `,
    )
    .eq('id', parsed.data.applicationId)
    .single()

  if (!application) {
    return { error: 'Application not found' }
  }

  if (application.status !== 'accepted') {
    return {
      error: 'Enrollment letters can only be sent for accepted applications.',
    }
  }

  const { tuitionPaidGhs, tuitionInvoiceStatus } = sumTuitionPaidFromInvoices(
    application.invoices as {
      type: string
      status: string
      total_ghs?: number
      installments?: { amount_ghs: number }[] | null
    }[],
  )

  const tuitionInvoice = (application.invoices as { type: string; status: string; total_ghs?: number }[] | null)?.find(
    (inv) => inv.type === 'tuition',
  )

  const effectiveTuitionPaid =
    tuitionPaidGhs > 0
      ? tuitionPaidGhs
      : tuitionInvoice?.status === 'paid'
        ? Number(tuitionInvoice.total_ghs ?? 0)
        : 0

  if (effectiveTuitionPaid <= 0) {
    return {
      error:
        'Record at least one tuition payment before sending the enrollment letter.',
    }
  }

  const ensuredStudent = await ensureStudentRecordForApplication(
    supabase,
    parsed.data.applicationId,
  )
  if (!ensuredStudent) {
    return {
      error:
        'Could not create a student record for this application. Ensure the applicant has a portal account (auth link) before sending the enrollment letter.',
    }
  }

  const pdfKey = await generateAndStoreAdmissionLetterPdf(parsed.data.applicationId)
  if (!pdfKey) {
    return { error: 'Failed to generate enrollment letter PDF' }
  }

  const now = new Date().toISOString()
  const fileName = `Enrollment-Letter-${application.reference}.pdf`

  const student = ensuredStudent

  await supabase
    .from('documents')
    .delete()
    .eq('application_id', parsed.data.applicationId)
    .eq('document_type', 'admission_letter')

  await supabase.from('documents').insert({
    application_id: parsed.data.applicationId,
    student_id: student.id,
    document_type: 'admission_letter',
    r2_key: pdfKey,
    file_name: fileName,
    mime_type: 'application/pdf',
    uploaded_by: 'admin',
    uploaded_at: now,
  })

  const enrolledAt = application.enrolled_at ?? now

  const { error: updateError } = await supabase
    .from('applications')
    .update({
      admission_letter_r2_key: pdfKey,
      admission_letter_sent_at: now,
      admission_letter_sent_by_admin_id: admin.id,
      enrolled_at: enrolledAt,
      updated_at: now,
    })
    .eq('id', parsed.data.applicationId)

  if (updateError) {
    return safeActionError('admission-letter.update', updateError, 'Failed to send admission letter.')
  }

  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  if (!bucket) {
    return { error: 'Storage not configured' }
  }

  let pdfUrl: string
  try {
    pdfUrl = await generatePresignedDownloadUrl(
      bucket,
      pdfKey,
      ADMISSION_LETTER_EMAIL_URL_TTL_SECONDS,
    )
  } catch (presignError) {
    console.error('[admission-letter] presigned download URL failed', {
      message: presignError instanceof Error ? presignError.message : String(presignError),
    })
    return { error: 'Failed to create download link for enrollment letter' }
  }

  const courseRel = application.courses as
    | { title: string }
    | { title: string }[]
    | null
  const courseName = Array.isArray(courseRel) ? courseRel[0]?.title : courseRel?.title

  let emailStatus: 'sent' | 'failed' | 'skipped' = 'skipped'
  try {
    await sendAdmissionLetterEmail(application.real_email, {
      name: application.full_name,
      courseName: courseName ?? 'your programme',
      applicationReference: application.reference,
      pdfUrl,
    })
    emailStatus = 'sent'
  } catch {
    emailStatus = 'failed'
  }

  await logAuditEvent({
    actorId: admin.id,
    actorType: 'admin',
    action: 'enrollment_letter_sent',
    targetType: 'application',
    targetId: application.reference,
    metadata: { applicationId: parsed.data.applicationId, studentId: student.id },
  })

  await logNotification(supabase, {
    applicationId: parsed.data.applicationId,
    studentId: student.id,
    channel: 'email',
    eventType: 'admission_letter_sent',
    recipient: application.real_email,
    status: emailStatus,
    providerResponse: { documentKey: pdfKey },
  })

  revalidatePath(`/admin/applications/${parsed.data.applicationId}`)
  revalidatePath(`/admin/students/${student.id}`)
  revalidatePath('/admin/students')

  const lifecycle = deriveProgramLifecycleStatus({
    registeredAt: now,
    enrolledAt,
    tuitionPaidGhs: effectiveTuitionPaid,
    tuitionInvoiceStatus,
    hasStudentRecord: Boolean(student),
  })

  return {
    success: true,
    enrolled: lifecycle === 'enrolled' || lifecycle === 'fully_paid',
  }
}
