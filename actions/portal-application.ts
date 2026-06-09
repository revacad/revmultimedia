'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { linkApplicationToReturningStudent } from '@/lib/applications/link-returning-student'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import { checkIdempotency, storeIdempotencyResult } from '@/lib/idempotency'
import { normalisePhone } from '@/lib/phone'
import {
  deliverApplicationReceivedEmail,
  deliverWhatsAppThenSms,
} from '@/lib/notifications/log-delivery'
import { sendAdminNewApplication } from '@/lib/notifications/email'
import { runAfterResponse } from '@/lib/background'
import { invalidateAdminStats } from '@/lib/redis/invalidate'
import {
  copyDocumentsFromPreviousApplication,
  findPreviousApplicationId,
} from '@/lib/portal/copy-return-student-documents'
import { fetchReturnStudentEducation } from '@/lib/portal/return-student-education'
import { getApplicationFeeGhs } from '@/lib/settings/application-fee'
import {
  findSameIntakeEnrollmentConflictByAuthUser,
} from '@/lib/portal/check-same-intake-enrollment'
import { submitReturnStudentApplicationSchema } from '@/lib/validations/return-application'

type RpcResult = {
  error?: string
  reference?: string
  application_id?: string
  invoice_reference?: string
  invoice_id?: string
}

/** Check if the logged-in student already has an active enrollment in this intake. */
export async function checkSameIntakeEnrollment(intakeId: string) {
  const user = await requirePortalUser()
  const supabase = createAdminClient()

  const conflict = await findSameIntakeEnrollmentConflictByAuthUser(
    supabase,
    user.id,
    intakeId,
  )

  if (!conflict) {
    return { conflict: false as const }
  }

  return {
    conflict: true as const,
    courseTitle: conflict.courseTitle,
    message: conflict.message,
  }
}

export async function submitReturnStudentApplication(formData: unknown) {
  const parsed = submitReturnStudentApplicationSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: 'Invalid form data', details: parsed.error.flatten() }
  }

  const user = await requirePortalUser()
  const supabase = createAdminClient()

  const { data: studentRows } = await supabase
    .from('students')
    .select(
      `
      id,
      student_id,
      auth_user_id,
      full_name,
      real_email,
      phone,
      date_of_birth,
      gender,
      country,
      address,
      state_region,
      city,
      application_id,
      is_active,
      created_at
    `,
    )
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: true })

  const student = studentRows?.[0] ?? null

  if (!student?.is_active) {
    return { error: 'Only enrolled students can apply for another course here.' }
  }

  const sameIntakeConflict = await findSameIntakeEnrollmentConflictByAuthUser(
    supabase,
    student.auth_user_id,
    parsed.data.intakeId,
  )
  if (sameIntakeConflict) {
    return { error: sameIntakeConflict.message }
  }

  const priorEducation = await fetchReturnStudentEducation(supabase, {
    application_id: student.application_id,
    auth_user_id: student.auth_user_id,
  })

  if (!priorEducation) {
    return {
      error:
        'We could not find education details from your previous application. Please contact info@revmultimediagh.com for help.',
    }
  }

  const { isDuplicate, result: cachedResult } = await checkIdempotency(parsed.data.idempotencyKey)
  if (isDuplicate && cachedResult && typeof cachedResult === 'object') {
    return cachedResult as {
      success: boolean
      reference: string
      invoiceReference?: string
    }
  }

  let normalisedPhone: string
  try {
    normalisedPhone = normalisePhone(student.phone, student.country === 'Ghana' ? 'GH' : undefined)
  } catch {
    return { error: 'Your saved phone number is invalid. Please update your profile or contact support.' }
  }

  const { data: rpcRaw, error: rpcError } = await supabase.rpc('create_application', {
    p_real_email: student.real_email,
    p_phone: normalisedPhone,
    p_full_name: student.full_name,
    p_date_of_birth: student.date_of_birth,
    p_gender: student.gender,
    p_country: student.country,
    p_address: student.address,
    p_state_region: student.state_region,
    p_city: student.city,
    p_qualification: priorEducation.qualification,
    p_institution: priorEducation.institution,
    p_year_completed: priorEducation.yearCompleted,
    p_prior_experience: priorEducation.priorExperience ?? null,
    p_course_id: parsed.data.courseId,
    p_intake_id: parsed.data.intakeId,
    p_hybrid_attendance_confirmed: parsed.data.hybridAttendanceConfirmed,
    p_internal_email_domain: process.env.INTERNAL_EMAIL_DOMAIN!,
  })

  if (rpcError) {
    console.error('[submitReturnStudentApplication] RPC failed', rpcError)
    return { error: 'Failed to submit application. Please try again.' }
  }

  const rpc = rpcRaw as RpcResult | null
  if (rpc?.error === 'duplicate') {
    return {
      error:
        'You already have an active application for this intake. Contact info@revmultimediagh.com if you need help.',
    }
  }

  if (!rpc?.reference || !rpc.application_id) {
    return { error: 'Failed to submit application. Please try again.' }
  }

  await linkApplicationToReturningStudent(supabase, rpc.application_id, {
    studentDbId: student.id,
    permanentStudentId: student.student_id,
    authUserId: student.auth_user_id,
    fullName: student.full_name,
    realEmail: student.real_email,
    phone: student.phone,
    dateOfBirth: student.date_of_birth,
    gender: student.gender,
    country: student.country,
    address: student.address,
    stateRegion: student.state_region,
    city: student.city,
    qualification: priorEducation.qualification,
    institution: priorEducation.institution,
    yearCompleted: priorEducation.yearCompleted,
    priorExperience: priorEducation.priorExperience ?? null,
  })

  const previousApplicationId = await findPreviousApplicationId(supabase, {
    studentDbId: student.id,
    authUserId: student.auth_user_id,
    originalApplicationId: student.application_id,
    excludeApplicationId: rpc.application_id,
  })

  if (previousApplicationId) {
    const copyResult = await copyDocumentsFromPreviousApplication(
      supabase,
      previousApplicationId,
      rpc.application_id,
    )
    if (!copyResult.ok) {
      console.error(
        '[submitReturnStudentApplication] document copy failed',
        copyResult.error,
      )
    }
  } else {
    console.error('[submitReturnStudentApplication] no previous application for documents')
  }

  const successResult = {
    success: true as const,
    reference: rpc.reference,
    invoiceReference: rpc.invoice_reference,
  }
  await storeIdempotencyResult(parsed.data.idempotencyKey, successResult)

  const [{ data: courseRow }, { data: intakeRow }] = await Promise.all([
    supabase.from('courses').select('title').eq('id', parsed.data.courseId).single(),
    supabase.from('intakes').select('name').eq('id', parsed.data.intakeId).single(),
  ])

  const courseTitle = courseRow?.title ?? 'your course'

  let applicationFeeGhs = 0
  if (rpc.invoice_id) {
    const { data: invoiceById } = await supabase
      .from('invoices')
      .select('total_ghs')
      .eq('id', rpc.invoice_id)
      .maybeSingle()
    applicationFeeGhs = Number(invoiceById?.total_ghs ?? 0)
  } else if (rpc.invoice_reference) {
    const { data: invoiceByRef } = await supabase
      .from('invoices')
      .select('total_ghs')
      .eq('reference', rpc.invoice_reference)
      .maybeSingle()
    applicationFeeGhs = Number(invoiceByRef?.total_ghs ?? 0)
  }
  if (!applicationFeeGhs) {
    applicationFeeGhs = await getApplicationFeeGhs()
  }

  void runAfterResponse(async () => {
    await deliverApplicationReceivedEmail({
      email: student.real_email,
      name: student.full_name,
      reference: rpc.reference!,
      courseName: courseTitle,
      intakeName: intakeRow?.name,
      applicationFeeGhs,
      applicationId: rpc.application_id!,
      supabase,
    })

    await deliverWhatsAppThenSms({
      phone: normalisedPhone,
      message: `Rev Multimedia: Hi ${student.full_name.split(' ')[0]}, your application ${rpc.reference} has been received.`,
      applicationId: rpc.application_id,
      studentId: student.id,
      eventType: 'student_application_sms',
      supabase,
    })

    try {
      await sendAdminNewApplication({
        applicantName: student.full_name,
        reference: rpc.reference!,
        course: courseTitle,
      })
    } catch (err) {
      console.error('Admin new application email failed:', err)
    }
  })

  revalidatePath('/portal/dashboard')
  revalidatePath('/portal/application')
  invalidateAdminStats()

  return successResult
}
