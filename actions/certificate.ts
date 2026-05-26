'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { sendCertificateUploaded } from '@/lib/notifications/email'
import { sendMessage } from '@/lib/notifications/sms'
import { uploadCertificateSchema } from '@/lib/validations/certificate'

export async function uploadCertificate(data: {
  studentId: string
  enrollmentId: string
  courseId: string
  r2Key: string
  fileName: string
}): Promise<{ error?: string; success?: boolean }> {
  const parsed = uploadCertificateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid certificate details' }
  }

  const session = await requireAdmin().catch(() => null)
  if (!session) {
    return { error: 'Not an admin' }
  }

  const supabase = createAdminClient()
  const payload = parsed.data

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('auth_user_id', session.userId)
    .single()

  if (!admin) {
    return { error: 'Not an admin' }
  }

  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('enrollment_id', payload.enrollmentId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('certificates')
      .update({
        r2_key: payload.r2Key,
        file_name: payload.fileName,
        uploaded_by_admin_id: admin.id,
        uploaded_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase.from('certificates').insert({
      student_id: payload.studentId,
      enrollment_id: payload.enrollmentId,
      course_id: payload.courseId,
      r2_key: payload.r2Key,
      file_name: payload.fileName,
      uploaded_by_admin_id: admin.id,
    })

    if (error) {
      return { error: error.message }
    }
  }

  const { data: student } = await supabase
    .from('students')
    .select('real_email, full_name, phone')
    .eq('id', payload.studentId)
    .single()

  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', payload.courseId)
    .single()

  if (student && course) {
    const smsBody = `Rev Multimedia: Your ${course.title} certificate is ready. Log in to download it.`

    await sendCertificateUploaded(student.real_email, {
      name: student.full_name,
      courseName: course.title,
    }).catch(() => undefined)

    let channel: 'whatsapp' | 'sms' = 'whatsapp'
    let logStatus: 'sent' | 'failed' | 'skipped' = 'sent'
    let providerResponse: Record<string, string> | null = null

    const waResult = await sendMessage(student.phone, smsBody, 'whatsapp')

    if (waResult.sent) {
      logStatus = 'sent'
    } else {
      const smsResult = await sendMessage(student.phone, smsBody, 'sms')
      channel = 'sms'

      if (smsResult.sent) {
        logStatus = 'sent'
        providerResponse = waResult.skipped
          ? {
              note: 'Delivered via SMS because WhatsApp is not configured',
            }
          : { note: 'Delivered via SMS after WhatsApp failed' }
      } else if (smsResult.skipped) {
        logStatus = 'skipped'
        providerResponse = {
          message:
            'WhatsApp and SMS not configured. Set Sent.dm API key and WhatsApp template ID under Admin → Settings → Messaging, or configure Fish Africa for SMS.',
        }
      } else {
        logStatus = 'failed'
        providerResponse = {
          error: smsResult.error ?? waResult.error ?? 'Message delivery failed',
        }
      }
    }

    await supabase.from('notifications_log').insert({
      student_id: payload.studentId,
      channel,
      event_type: 'certificate_uploaded',
      recipient: student.phone,
      status: logStatus,
      provider_response: providerResponse,
    })
  }

  revalidatePath(`/admin/students/${payload.studentId}`)
  revalidatePath('/portal/dashboard')
  return { success: true }
}
