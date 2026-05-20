'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { sendCertificateUploaded } from '@/lib/notifications/email'
import { sendMessage } from '@/lib/notifications/sms'

export async function uploadCertificate(data: {
  studentId: string
  enrollmentId: string
  courseId: string
  r2Key: string
  fileName: string
}): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAdmin().catch(() => null)
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

  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('enrollment_id', data.enrollmentId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('certificates')
      .update({
        r2_key: data.r2Key,
        file_name: data.fileName,
        uploaded_by_admin_id: admin.id,
        uploaded_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase.from('certificates').insert({
      student_id: data.studentId,
      enrollment_id: data.enrollmentId,
      course_id: data.courseId,
      r2_key: data.r2Key,
      file_name: data.fileName,
      uploaded_by_admin_id: admin.id,
    })

    if (error) {
      return { error: error.message }
    }
  }

  const { data: student } = await supabase
    .from('students')
    .select('real_email, full_name, phone')
    .eq('id', data.studentId)
    .single()

  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', data.courseId)
    .single()

  if (student && course) {
    await sendCertificateUploaded(student.real_email, {
      name: student.full_name,
      courseName: course.title,
    }).catch(() => undefined)

    await sendMessage(
      student.phone,
      `Rev Multimedia: Your ${course.title} certificate is ready. Log in to download it.`,
      'whatsapp',
    ).catch(() => undefined)

    await supabase.from('notifications_log').insert({
      student_id: data.studentId,
      channel: 'whatsapp',
      event_type: 'certificate_uploaded',
      recipient: student.phone,
      status: 'sent',
    })
  }

  revalidatePath(`/admin/students/${data.studentId}`)
  revalidatePath('/portal/dashboard')
  return { success: true }
}
