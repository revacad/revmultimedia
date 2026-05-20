'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { normalisePhone } from '@/lib/phone'
import { submitApplicationSchema } from '@/lib/validations/application'
import { checkIdempotency, storeIdempotencyResult } from '@/lib/idempotency'
import {
  sendApplicationReceived,
  sendAdminNewApplication,
  sendStatusChanged,
} from '@/lib/notifications/email'
import { sendMessage } from '@/lib/notifications/sms'
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from '@/lib/applications/types'
import type { SupabaseClient } from '@supabase/supabase-js'

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

  const [{ data: courseRow }, { data: intakeRow }] = await Promise.all([
    supabase.from('courses').select('title').eq('id', data.courseId).single(),
    supabase.from('intakes').select('name').eq('id', data.intakeId).single(),
  ])

  await Promise.allSettled([
    sendApplicationReceived(data.email, {
      name: data.fullName,
      reference: rpc.reference!,
      courseName: courseRow?.title,
      intakeName: intakeRow?.name,
    }),
    sendAdminNewApplication({
      applicantName: data.fullName,
      reference: rpc.reference!,
      course: courseRow?.title ?? data.courseId,
    }),
    sendMessage(
      normalisedPhone,
      `Rev Multimedia: Hi ${data.fullName.split(' ')[0]}, your application ${rpc.reference} has been received. Check your email for next steps.`,
      'sms',
    ),
  ])

  await storeIdempotencyResult(idempotencyKey, successResult)
}

export async function submitApplication(formData: unknown) {
  const parsed = submitApplicationSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: 'Invalid form data', details: parsed.error.flatten() }
  }

  const data = parsed.data

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
    yearCompleted: data.yearCompleted
      ? parseInt(String(data.yearCompleted), 10)
      : null,
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

  void runPostSubmitSideEffects(
    supabase,
    rpc,
    data,
    normalisedPhone,
    data.idempotencyKey,
    successResult,
  ).catch((err) => console.error('Post-submit side effects error:', err))

  return {
    success: true,
    reference: rpc.reference,
    invoiceReference: rpc.invoice_reference,
    applicantName: data.fullName,
    email: data.email,
  }
}

function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value)
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()

    if (!isApplicationStatus(status)) {
      return { error: 'Invalid status' }
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)

    if (error) {
      return { error: error.message }
    }

    const { data: app } = await supabase
      .from('applications')
      .select('real_email, full_name, reference')
      .eq('id', applicationId)
      .single()

    if (app) {
      try {
        await sendStatusChanged(app.real_email, {
          name: app.full_name,
          status,
          reference: app.reference,
        })
        await supabase.from('notifications_log').insert({
          application_id: applicationId,
          channel: 'email',
          event_type: 'status_changed',
          recipient: app.real_email,
          status: 'sent',
        })
      } catch (notifyError) {
        console.error('Status change notification failed:', notifyError)
        await supabase.from('notifications_log').insert({
          application_id: applicationId,
          channel: 'email',
          event_type: 'status_changed',
          recipient: app.real_email,
          status: 'failed',
        })
      }
    }

    revalidatePath(`/admin/applications/${applicationId}`)
    revalidatePath('/admin/applications')
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
    const session = await requireAdmin()
    const trimmed = note.trim()
    if (!trimmed) {
      return { error: 'Note cannot be empty' }
    }

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
      application_id: applicationId,
      note: trimmed,
      created_by: admin.id,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/admin/applications/${applicationId}`)
    return { success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to add note',
    }
  }
}
