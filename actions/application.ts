'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { normalisePhone } from '@/lib/phone'
import {
  addAdminNoteSchema,
  submitApplicationSchema,
  updateApplicationStatusSchema,
} from '@/lib/validations/application'
import { checkIdempotency, storeIdempotencyResult } from '@/lib/idempotency'
import {
  sendApplicationReceived,
  sendAdminNewApplication,
  sendStatusChanged,
} from '@/lib/notifications/email'
import { sendMessage } from '@/lib/notifications/sms'
import { runAfterResponse } from '@/lib/background'
import { logAuditEvent } from '@/lib/audit/log'
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
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const RPC_TIMEOUT_MS = 15_000

function isPreviewApplication(courseId: string, intakeId: string): boolean {
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
  password: string
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
    console.error('Documents insert error:', docsError)
  }

  const internalEmail = `${rpc.reference}@${process.env.INTERNAL_EMAIL_DOMAIN!}`

  const { error: authError } = await supabase.auth.admin.createUser({
    email: internalEmail,
    password: data.password,
    email_confirm: true,
  })

  if (authError && !authError.message.includes('already registered')) {
    console.error('Auth error:', authError)
  }

  await storeIdempotencyResult(idempotencyKey, successResult)
}

export async function submitApplication(formData: unknown) {
  const parsed = submitApplicationSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: 'Invalid form data', details: parsed.error.flatten() }
  }

  const data = parsed.data
  const ip = await getClientIp()

  const guard = await guardFormSubmission({
    form: 'apply',
    ip,
    email: data.email,
    honeypot: data.website,
    fieldValues: [
      data.fullName,
      data.email,
      data.phone,
      data.address,
      data.stateRegion ?? '',
      data.city ?? '',
      data.institution,
      data.priorExperience ?? '',
      data.password,
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
    institution: sanitizePlainText(data.institution, 200),
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
      reference: 'REVAPP202500001',
      invoiceReference: 'REVAPF202500001',
      isPreview: true,
      applicantName: data.fullName,
      email: data.email,
    }
    void storeIdempotencyResult(data.idempotencyKey, previewResult)
    return previewResult
  }

  const pYearCompleted = parseInt(String(sanitisedData.yearCompleted), 10)

  const supabase = createAdminClient()

  let result: RpcResult | null = null
  let error: { message: string; code?: string; details?: string; hint?: string } | null = null

  try {
    const rpcResponse = await rpcWithTimeout(
      supabase.rpc('create_application', {
        p_real_email: sanitisedData.email,
        p_phone: normalisedPhone,
        p_full_name: sanitisedData.fullName,
        p_date_of_birth: sanitisedData.dateOfBirth,
        p_gender: sanitisedData.gender,
        p_country: sanitisedData.country,
        p_address: sanitisedData.address,
        p_state_region: sanitisedData.stateRegion || null,
        p_city: sanitisedData.city || null,
        p_qualification: sanitisedData.qualification,
        p_institution: sanitisedData.institution,
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
      debug: rpcTimeoutError instanceof Error ? rpcTimeoutError.message : 'RPC timeout',
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
      debug: error.message,
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
    console.error('RPC create_application returned unexpected payload:', result)
    return { error: 'Failed to submit application. Please try again.' }
  }

  const successResult = {
    success: true as const,
    reference: rpc.reference,
    invoiceReference: rpc.invoice_reference,
    applicantName: data.fullName,
    email: data.email,
  }

  const [{ data: courseRow }, { data: intakeRow }] = await Promise.all([
    supabase.from('courses').select('title').eq('id', data.courseId).single(),
    supabase.from('intakes').select('name').eq('id', data.intakeId).single(),
  ])

  const courseTitle = courseRow?.title ?? data.courseId
  const intakeName = intakeRow?.name

  try {
    await Promise.race([
      sendApplicationReceived(data.email, {
        name: data.fullName,
        reference: rpc.reference,
        courseName: courseTitle,
        intakeName,
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ])
  } catch (err) {
    console.error('Application email failed:', err)
  }

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
    await Promise.allSettled([
      sendMessage(
        normalisedPhone,
        `Rev Multimedia: Hi ${data.fullName.split(' ')[0]}, your application ${rpc.reference} has been received. Log in to your portal to track it.`,
        'sms',
      ),
      sendAdminNewApplication({
        applicantName: data.fullName,
        reference: rpc.reference!,
        course: courseTitle,
      }),
    ])
  })

  return {
    success: true,
    reference: rpc.reference,
    invoiceReference: rpc.invoice_reference,
    applicantName: data.fullName,
    email: data.email,
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

    const session = await requireAdmin()
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
      return { error: error.message }
    }

    await logAuditEvent({
      adminId: admin.id,
      action: 'application.status_changed',
      entityType: 'application',
      entityId: String(appId),
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

      const results = await Promise.allSettled([
        sendStatusChanged(app.real_email, {
          name: app.full_name,
          status: newStatus,
          reference: app.reference,
        }),
        statusMessages[newStatus]
          ? sendMessage(app.phone, statusMessages[newStatus], 'sms')
          : Promise.resolve(),
      ])

      const emailFailed = results[0].status === 'rejected'
      await supabase.from('notifications_log').insert({
        application_id: appId,
        channel: 'email',
        event_type: 'status_changed',
        recipient: app.real_email,
        status: emailFailed ? 'failed' : 'sent',
      })
    })

    revalidatePath(`/admin/applications/${appId}`)
    revalidatePath('/admin/applications')
    if (newStatus === 'accepted') {
      invalidateAdminStats()
      revalidatePath('/admin/payments')
    }
    return { success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to update status',
    }
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

    const session = await requireAdmin()
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
      return { error: error.message }
    }

    revalidatePath(`/admin/applications/${appId}`)
    return { success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to add note',
    }
  }
}
