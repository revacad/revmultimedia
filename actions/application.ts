'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaffAdmin } from '@/lib/auth/admin'
import { normalisePhone } from '@/lib/phone'
import {
  addAdminNoteSchema,
  submitApplicationSchema,
  updateApplicationStatusSchema,
} from '@/lib/validations/application'
import { checkIdempotency, storeIdempotencyResult } from '@/lib/idempotency'
import {
  sendAdminNewApplication,
  sendStatusChanged,
} from '@/lib/notifications/email'
import {
  deliverApplicationReceivedEmail,
  deliverWaitlistConfirmationEmail,
  deliverWhatsAppThenSms,
  logNotification,
} from '@/lib/notifications/log-delivery'
import { notifyParentLevelUpApplicationSubmitted } from '@/lib/notifications/parent-level-up'
import { runAfterResponse } from '@/lib/background'
import { logAuditEvent } from '@/lib/audit/log'
import { safeActionError } from '@/lib/errors/action'
import { createApplicantAuthUserAndLink } from '@/lib/auth/link-application-auth'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createTuitionInvoice,
  sendTuitionInvoiceNotifications,
} from '@/lib/promo/create-tuition-invoice'
import { defaultDueDate } from '@/lib/payments/format'
import { invalidateAdminStats } from '@/lib/redis/invalidate'
import { getClientIp } from '@/lib/auth/getClientIp'
import { checkRateLimit, applySubmitLimit } from '@/lib/redis/ratelimit'
import { guardFormSubmission } from '@/lib/security/abuse'
import { sanitizePlainText } from '@/lib/security/html'
import { sanitizeFileName } from '@/lib/security/files'

type RpcResult = {
  error?: string
  reference?: string
  application_id?: string
  invoice_reference?: string
  waitlisted?: boolean
  waitlist_position?: number
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const RPC_TIMEOUT_MS = 15_000

function isPreviewApplication(courseId: string, intakeId: string): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false
  }
  return (
    courseId === 'preview-graphic-design' ||
    intakeId === 'preview-intake-sept-2025' ||
    intakeId === 'preview-intake-1' ||
    !UUID_RE.test(courseId) ||
    !UUID_RE.test(intakeId)
  )
}

async function rpcWithTimeout<T>(
  promise: PromiseLike<{ data: T; error: { message: string; code?: string; details?: string; hint?: string } | null }>,
  ms: number,
): Promise<{ data: T; error: { message: string; code?: string; details?: string; hint?: string } | null }> {
  const timeoutPromise = new Promise<{
    data: T
    error: { message: string }
  }>((_, reject) => {
    setTimeout(() => reject(new Error(`RPC timeout after ${ms / 1000} seconds`)), ms)
  })

  return Promise.race([promise, timeoutPromise])
}

type SubmitPayload = {
  courseId: string
  intakeId: string
  country: string
  fullName: string
  email: string
  password?: string
  documents: {
    idDocument: { key: string; fileName: string; fileSize: number; mimeType: string }
    passportPhoto: { key: string; fileName: string; fileSize: number; mimeType: string }
    certificates?: { key: string; fileName: string; fileSize: number; mimeType: string }[]
  }
}

async function runPostSubmitSideEffects(
  supabase: SupabaseClient,
  rpc: RpcResult,
  data: SubmitPayload,
  normalisedPhone: string,
  idempotencyKey: string,
  successResult: {
    success: true
    reference: string
    invoiceReference?: string
    applicantName: string
    email: string
  },
  courseTitle: string,
): Promise<void> {
  const idDocType = data.country === 'Ghana' ? 'national_id' : 'passport'
  const documentRows = [
    {
      application_id: rpc.application_id,
      document_type: idDocType,
      r2_key: data.documents.idDocument.key,
      file_name: data.documents.idDocument.fileName,
      file_size_bytes: Number(data.documents.idDocument.fileSize),
      mime_type: data.documents.idDocument.mimeType,
      uploaded_by: 'student' as const,
    },
    {
      application_id: rpc.application_id,
      document_type: 'passport_photo',
      r2_key: data.documents.passportPhoto.key,
      file_name: data.documents.passportPhoto.fileName,
      file_size_bytes: Number(data.documents.passportPhoto.fileSize),
      mime_type: data.documents.passportPhoto.mimeType,
      uploaded_by: 'student' as const,
    },
    ...(data.documents.certificates ?? []).map((file) => ({
      application_id: rpc.application_id!,
      document_type: 'certificate' as const,
      r2_key: file.key,
      file_name: file.fileName,
      file_size_bytes: Number(file.fileSize),
      mime_type: file.mimeType,
      uploaded_by: 'student' as const,
    })),
  ]

  const { error: docsError } = await supabase.from('documents').insert(documentRows)
  if (docsError) {
    console.error('Documents insert error:', {
      message: docsError.message,
      code: docsError.code,
    })
  }

  if (rpc.application_id && rpc.reference && data.password) {
    await createApplicantAuthUserAndLink(
      supabase,
      rpc.application_id,
      rpc.reference,
      data.password,
    )
  }

  await storeIdempotencyResult(idempotencyKey, successResult)
}

export async function submitApplication(formData: unknown) {
  const parsed = submitApplicationSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: 'Invalid form data', details: parsed.error.flatten() }
  }

  const data = {
    ...parsed.data,
    ...(parsed.data.applicationChannel === 'level_up'
      ? {
          qualification: 'wassce' as const,
          institution:
            parsed.data.institution?.trim() ||
            parsed.data.shsSchoolNameFreeform?.trim() ||
            '',
        }
      : {}),
  }
  const ip = await getClientIp()

  const guard = await guardFormSubmission({
    form: 'apply',
    ip,
    email: data.email,
    honeypot: data._hp ?? data.fax,
    phone: data.phone,
    fieldValues: [
      data.fullName,
      data.email,
      data.phone,
      data.address,
      data.stateRegion ?? '',
      data.city ?? '',
      data.institution ?? '',
      data.priorExperience ?? '',
      data.password ?? '',
    ],
  })
  if (!guard.ok) return { error: guard.error }
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit(applySubmitLimit, ip),
    checkRateLimit(applySubmitLimit, `email:${data.email}`),
  ])
  if (!byIp.allowed || !byEmail.allowed) {
    return {
      error:
        'Too many application attempts. Please wait before submitting again or contact us at info@revmultimediagh.com',
    }
  }

  const { isDuplicate, result: cachedResult } = await checkIdempotency(data.idempotencyKey)
  if (isDuplicate && cachedResult && typeof cachedResult === 'object') {
    return cachedResult as {
      success: boolean
      reference: string
      invoiceReference?: string
      applicantName?: string
      email?: string
    }
  }

  const sanitisedData = {
    ...data,
    fullName: sanitizePlainText(data.fullName, 200),
    address: sanitizePlainText(data.address, 500),
    institution: sanitizePlainText(data.institution ?? '', 200),
    stateRegion: data.stateRegion
      ? sanitizePlainText(data.stateRegion, 120)
      : undefined,
    city: data.city ? sanitizePlainText(data.city, 120) : undefined,
    priorExperience: data.priorExperience
      ? sanitizePlainText(data.priorExperience, 2000)
      : undefined,
    yearCompleted: data.yearCompleted
      ? parseInt(String(data.yearCompleted), 10)
      : null,
    documents: {
      ...data.documents,
      idDocument: {
        ...data.documents.idDocument,
        fileName: sanitizeFileName(data.documents.idDocument.fileName),
      },
      passportPhoto: {
        ...data.documents.passportPhoto,
        fileName: sanitizeFileName(data.documents.passportPhoto.fileName),
      },
      certificates: data.documents.certificates?.map((f) => ({
        ...f,
        fileName: sanitizeFileName(f.fileName),
      })),
    },
  }

  if (
    sanitisedData.yearCompleted === null ||
    Number.isNaN(sanitisedData.yearCompleted)
  ) {
    return { error: 'Invalid form data' }
  }

  let normalisedPhone: string
  try {
    normalisedPhone = normalisePhone(
      data.phone,
      data.country === 'Ghana' ? 'GH' : undefined,
    )
  } catch {
    return { error: 'Invalid phone number' }
  }

  if (isPreviewApplication(data.courseId, data.intakeId)) {
    console.log('Preview submission — skipping DB insert', {
      courseId: data.courseId,
      intakeId: data.intakeId,
    })
    const previewResult = {
      success: true as const,
      reference: 'PREVIEW-APP-REF',
      invoiceReference: 'PREVIEW-INV-REF',
      isPreview: true,
      applicantName: data.fullName,
      email: data.email,
    }
    void storeIdempotencyResult(data.idempotencyKey, previewResult)
    return previewResult
  }

  const pYearCompleted = parseInt(String(sanitisedData.yearCompleted), 10)

  const supabase = createAdminClient()

  const applicantEmail = sanitisedData.email
  const applicantName = sanitisedData.fullName

  let result: RpcResult | null = null
  let error: { message: string; code?: string; details?: string; hint?: string } | null = null

  try {
    const rpcResponse = await rpcWithTimeout(
      supabase.rpc('create_application', {
        p_real_email: applicantEmail,
        p_phone: normalisedPhone,
        p_full_name: applicantName,
        p_date_of_birth: sanitisedData.dateOfBirth,
        p_gender: sanitisedData.gender,
        p_country: sanitisedData.country,
        p_address: sanitisedData.address,
        p_state_region: sanitisedData.stateRegion || null,
        p_city: sanitisedData.city || null,
        p_qualification: sanitisedData.qualification,
        p_institution: sanitisedData.institution ?? '',
        p_year_completed: pYearCompleted,
        p_prior_experience: sanitisedData.priorExperience || null,
        p_course_id: sanitisedData.courseId,
        p_intake_id: sanitisedData.intakeId,
        p_hybrid_attendance_confirmed: sanitisedData.hybridAttendanceConfirmed || false,
        p_internal_email_domain: process.env.INTERNAL_EMAIL_DOMAIN!,
      }),
      RPC_TIMEOUT_MS,
    )
    result = rpcResponse.data as RpcResult | null
    error = rpcResponse.error
  } catch (rpcTimeoutError) {
    console.error('RPC create_application timed out:', rpcTimeoutError)
    return {
      error: 'Submission timed out. Please try again.',
    }
  }

  if (error) {
    console.error('RPC create_application failed:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    return {
      error: 'Failed to submit application. Please try again.',
    }
  }

  const rpc = result

  if (rpc?.error === 'duplicate') {
    return {
      error: 'duplicate',
      message:
        'An application already exists with this contact information. Please contact us directly at info@revmultimediagh.com',
    }
  }

  if (!rpc?.reference || !rpc.application_id) {
    console.error('RPC create_application returned unexpected payload', {
      hasReference: Boolean(rpc?.reference),
      hasApplicationId: Boolean(rpc?.application_id),
    })
    return { error: 'Failed to submit application. Please try again.' }
  }

  const isWaitlisted = Boolean(rpc.waitlisted)

  const successResult = {
    success: true as const,
    reference: rpc.reference,
    invoiceReference: rpc.invoice_reference,
    applicantName,
    email: applicantEmail,
    waitlisted: isWaitlisted,
    waitlistPosition: rpc.waitlist_position,
  }

  const [{ data: courseRow }, { data: intakeRow }] = await Promise.all([
    supabase.from('courses').select('title').eq('id', data.courseId).single(),
    supabase.from('intakes').select('name').eq('id', data.intakeId).single(),
  ])

  const courseTitle = courseRow?.title ?? data.courseId
  const intakeName = intakeRow?.name

  const channel = data.applicationChannel ?? 'standard'

  let parentWhatsappNormalized: string | null = null
  if (channel === 'level_up') {
    try {
      parentWhatsappNormalized = normalisePhone(data.parentGuardianWhatsapp!, 'GH')
    } catch {
      return { error: 'Invalid parent/guardian WhatsApp number' }
    }

    const { error: levelUpUpdateError } = await supabase
      .from('applications')
      .update({
        application_channel: 'level_up',
        parent_guardian_whatsapp: parentWhatsappNormalized,
        parent_guardian_email: data.parentGuardianEmail?.trim() || null,
        shs_school_id: data.shsSchoolId ?? null,
        shs_school_name_freeform: data.shsSchoolNameFreeform?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rpc.application_id)

    if (levelUpUpdateError) {
      console.error('Level Up application update failed:', levelUpUpdateError)
    }
  }

  void Promise.race([
    isWaitlisted
      ? deliverWaitlistConfirmationEmail({
          email: applicantEmail,
          name: applicantName,
          reference: rpc.reference,
          courseName: courseTitle,
          intakeName: intakeName ?? 'your intake',
          waitlistPosition: rpc.waitlist_position ?? 1,
          applicationId: rpc.application_id!,
          supabase,
        })
      : deliverApplicationReceivedEmail({
          email: applicantEmail,
          name: applicantName,
          reference: rpc.reference,
          courseName: courseTitle,
          intakeName,
          applicationId: rpc.application_id!,
          supabase,
        }),
    new Promise<void>((resolve) => setTimeout(resolve, 5000)),
  ])

  runAfterResponse(async () => {
    await runPostSubmitSideEffects(
      supabase,
      rpc,
      data,
      normalisedPhone,
      data.idempotencyKey,
      successResult,
      courseTitle,
    )

    const studentSms = isWaitlisted
      ? `Rev Multimedia: Hi ${applicantName.split(' ')[0]}, you are #${rpc.waitlist_position ?? 1} on the waitlist for ${courseTitle} (${rpc.reference}). We will contact you when a spot opens.`
      : `Rev Multimedia: Hi ${applicantName.split(' ')[0]}, your application ${rpc.reference} has been received. Log in to your portal to track it.`

    await deliverWhatsAppThenSms({
      phone: normalisedPhone,
      message: studentSms,
      applicationId: rpc.application_id,
      eventType: isWaitlisted ? 'waitlist_confirmation' : 'student_application_sms',
      supabase,
    })

    if (channel === 'level_up' && parentWhatsappNormalized) {
      await notifyParentLevelUpApplicationSubmitted({
        applicationId: rpc.application_id!,
        studentName: data.fullName,
        reference: rpc.reference!,
        courseName: courseTitle,
        parentWhatsapp: parentWhatsappNormalized,
        parentEmail: data.parentGuardianEmail,
        supabase,
      })
    }

    try {
      await sendAdminNewApplication({
        applicantName,
        reference: rpc.reference!,
        course: courseTitle,
      })
    } catch (err) {
      console.error('Admin new application email failed:', err)
    }
  })

  return {
    success: true,
    reference: rpc.reference,
    invoiceReference: rpc.invoice_reference,
    applicantName,
    email: applicantEmail,
    waitlisted: isWaitlisted,
    waitlistPosition: rpc.waitlist_position,
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const parsed = updateApplicationStatusSchema.safeParse({ applicationId, status })
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid request' }
    }

    const session = await requireStaffAdmin()
    const { applicationId: appId, status: newStatus } = parsed.data

    const supabase = createAdminClient()

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    if (!admin) {
      return { error: 'Not an admin' }
    }

    const { data: existing } = await supabase
      .from('applications')
      .select(
        `
        id,
        status,
        app_fee_paid,
        app_fee_paid_at,
        promo_code_id,
        reference,
        full_name,
        real_email,
        phone,
        country,
        courses(tuition_fee_ghs)
      `,
      )
      .eq('id', appId)
      .single()

    if (!existing) {
      return { error: 'Application not found' }
    }

    const currentStatus = existing.status

    if (newStatus === 'accepted') {
      if (!existing.app_fee_paid) {
        return {
          error: 'Application fee must be paid before you can accept this applicant.',
        }
      }

      const invoiceResult = await createTuitionInvoice(supabase, existing, {
        applicationId: appId,
        adminId: admin.id,
        dueDate: defaultDueDate(14),
      })

      if ('error' in invoiceResult) {
        return { error: invoiceResult.error }
      }

      if (invoiceResult.created) {
        const dueDate = defaultDueDate(14)
        runAfterResponse(async () => {
          await sendTuitionInvoiceNotifications(
            existing,
            invoiceResult.reference,
            invoiceResult.totalGhs,
            dueDate,
            invoiceResult.invoiceId,
          )
        })
      }
    }

    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', appId)

    if (error) {
      return safeActionError('application.updateStatus', error, 'Failed to update application status.')
    }

    await logAuditEvent({
      actorId: admin.id,
      actorType: 'admin',
      action: 'status_changed',
      targetType: 'application',
      targetId: String(appId),
      metadata: { oldStatus: currentStatus, newStatus: newStatus },
      oldValue: { status: currentStatus },
      newValue: { status: newStatus },
    })

    runAfterResponse(async () => {
      const { data: app } = await supabase
        .from('applications')
        .select('real_email, full_name, phone, reference')
        .eq('id', appId)
        .single()

      if (!app) return

      const statusMessages: Record<string, string> = {
        shortlisted: `Rev Multimedia: Great news ${app.full_name.split(' ')[0]}! Your application ${app.reference} has been shortlisted. Check your email for details.`,
        accepted: `Rev Multimedia: Congratulations ${app.full_name.split(' ')[0]}! Your application ${app.reference} has been accepted. Check your email for next steps.`,
        rejected: `Rev Multimedia: Thank you for applying ${app.full_name.split(' ')[0]}. Please check your email for an update on your application.`,
        deferred: `Rev Multimedia: Your application ${app.reference} has been deferred. Check your email for details.`,
      }

      try {
        await sendStatusChanged(app.real_email, {
          name: app.full_name,
          status: newStatus,
          reference: app.reference,
        })
        await logNotification(supabase, {
          applicationId: appId,
          channel: 'email',
          eventType: 'status_changed',
          recipient: app.real_email,
          status: 'sent',
        })
      } catch (err) {
        await logNotification(supabase, {
          applicationId: appId,
          channel: 'email',
          eventType: 'status_changed',
          recipient: app.real_email,
          status: 'failed',
          providerResponse: {
            error: err instanceof Error ? err.message : 'Status email failed',
          },
        })
      }

      if (statusMessages[newStatus]) {
        await deliverWhatsAppThenSms({
          phone: app.phone,
          message: statusMessages[newStatus],
          applicationId: appId,
          eventType: 'status_changed',
          supabase,
        })
      }
    })

    revalidatePath(`/admin/applications/${appId}`)
    revalidatePath('/admin/applications')
    if (newStatus === 'accepted') {
      invalidateAdminStats()
      revalidatePath('/admin/payments')
    }
    return { success: true }
  } catch (e) {
    return safeActionError('application.updateStatus', e, 'Failed to update application status.')
  }
}

export async function addAdminNote(
  applicationId: string,
  note: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const parsed = addAdminNoteSchema.safeParse({ applicationId, note })
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid note' }
    }

    const session = await requireStaffAdmin()
    const { applicationId: appId, note: trimmed } = parsed.data
    const safeNote = sanitizePlainText(trimmed, 2000)

    const supabase = createAdminClient()
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single()

    if (adminError || !admin) {
      return { error: 'Admin profile not found' }
    }

    const { error } = await supabase.from('admin_notes').insert({
      application_id: appId,
      note: safeNote,
      created_by: admin.id,
    })

    if (error) {
      return safeActionError('application.addNote', error, 'Failed to add note.')
    }

    revalidatePath(`/admin/applications/${appId}`)
    return { success: true }
  } catch (e) {
    return safeActionError('application.addNote', e, 'Failed to add note.')
  }
}
