import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { deliverWhatsAppThenSms } from '@/lib/notifications/log-delivery'
import { sendParentLevelUpApplicationSubmitted } from '@/lib/notifications/email'
import { logNotification } from '@/lib/notifications/log-delivery'
import { siteUrl } from '@/lib/seo'

export async function notifyParentLevelUpApplicationSubmitted(params: {
  applicationId: string
  studentName: string
  reference: string
  courseName: string
  parentWhatsapp: string
  parentEmail?: string | null
  supabase?: SupabaseClient
}): Promise<void> {
  const supabase = params.supabase ?? createAdminClient()

  const message =
    `Rev Multimedia: ${params.studentName} has submitted a Level Up application (${params.reference}) for ${params.courseName}. ` +
    `Application fee: GHS 100. Visit ${siteUrl}/portal/application or contact us on +233 27 581 8525.`

  await deliverWhatsAppThenSms({
    phone: params.parentWhatsapp,
    message,
    applicationId: params.applicationId,
    eventType: 'parent_application_submitted',
    supabase,
  })

  if (params.parentEmail?.trim()) {
    const email = params.parentEmail.trim()
    try {
      await sendParentLevelUpApplicationSubmitted(email, {
        studentName: params.studentName,
        reference: params.reference,
        courseName: params.courseName,
      })
      await logNotification(supabase, {
        applicationId: params.applicationId,
        channel: 'email',
        eventType: 'parent_application_submitted',
        recipient: email,
        status: 'sent',
      })
    } catch (err) {
      await logNotification(supabase, {
        applicationId: params.applicationId,
        channel: 'email',
        eventType: 'parent_application_submitted',
        recipient: email,
        status: 'failed',
        providerResponse: {
          error: err instanceof Error ? err.message : 'Parent email failed',
        },
      })
    }
  }
}
