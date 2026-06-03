'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaffAdmin } from '@/lib/auth/admin'
import { sendCertificateUploaded } from '@/lib/notifications/email'
import { deliverWhatsAppThenSms, logNotification } from '@/lib/notifications/log-delivery'
import { assertCanUploadCertificate } from '@/lib/enrollment/certificate-upload'
import { uploadCertificateSchema } from '@/lib/validations/certificate'
import { safeActionError } from '@/lib/errors/action'

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

  const session = await requireStaffAdmin().catch(() => null)
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

  const enrollmentCheck = await assertCanUploadCertificate(supabase, payload.enrollmentId)
  if (!enrollmentCheck.ok) {
    return { error: enrollmentCheck.error }
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
      return safeActionError('certificate.upload', error, 'Failed to upload certificate.')
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
      return safeActionError('certificate.upload', error, 'Failed to upload certificate.')
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

    try {
      await sendCertificateUploaded(student.real_email, {
        name: student.full_name,
        courseName: course.title,
      })
      await logNotification(supabase, {
        studentId: payload.studentId,
        channel: 'email',
        eventType: 'certificate_uploaded',
        recipient: student.real_email,
        status: 'sent',
      })
    } catch (err) {
      await logNotification(supabase, {
        studentId: payload.studentId,
        channel: 'email',
        eventType: 'certificate_uploaded',
        recipient: student.real_email,
        status: 'failed',
        providerResponse: {
          error: err instanceof Error ? err.message : 'Certificate email failed',
        },
      })
    }

    await deliverWhatsAppThenSms({
      phone: student.phone,
      message: smsBody,
      studentId: payload.studentId,
      eventType: 'certificate_uploaded',
      supabase,
    })
  }

  revalidatePath(`/admin/students/${payload.studentId}`)
  revalidatePath('/portal/dashboard')
  return { success: true }
}
