import AllMessageLogsClient, {
  type GlobalMessageLogRow,
} from '@/components/admin/communications/AllMessageLogsClient'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Message Log - Communications',
}

export const dynamic = 'force-dynamic'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function AdminCommunicationLogsPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const [{ data: commLogs, error: commError }, { data: notifications, error: notifError }] =
    await Promise.all([
      supabase
        .from('communication_logs')
        .select(
          `
          id, channel, status, recipient, error_message, sent_at,
          communication_campaigns(subject, message, channel),
          students(id, full_name, student_id)
        `,
        )
        .order('sent_at', { ascending: false })
        .limit(200),
      supabase
        .from('notifications_log')
        .select(
          `
          id, channel, event_type, status, recipient, provider_response, sent_at,
          students(id, full_name, student_id),
          applications(reference)
        `,
        )
        .order('sent_at', { ascending: false })
        .limit(200),
    ])

  if (commError) {
    console.error('[admin/communications/logs] communication_logs', commError)
  }
  if (notifError) {
    console.error('[admin/communications/logs] notifications_log', notifError)
  }

  type StudentRef = { id: string; full_name: string; student_id: string }

  const rows: GlobalMessageLogRow[] = []

  for (const row of commLogs ?? []) {
    const student = firstRelation(
      row.students as StudentRef | StudentRef[] | null,
    )
    const campaign = firstRelation(
      row.communication_campaigns as {
        subject: string | null
        message: string
        channel: string
      } | {
        subject: string | null
        message: string
        channel: string
      }[] | null,
    )

    rows.push({
      id: `c-${row.id}`,
      source: 'campaign',
      channel: row.channel,
      status: row.status,
      sentAt: row.sent_at,
      title: campaign?.subject?.trim() || 'Campaign message',
      body: campaign?.message?.trim() || '-',
      recipient: row.recipient,
      errorMessage: row.error_message,
      studentName: student?.full_name ?? null,
      studentPublicId: student?.student_id ?? null,
      studentProfileHref: student ? `/admin/students/${student.id}` : null,
    })
  }

  for (const row of notifications ?? []) {
    const student = firstRelation(
      row.students as StudentRef | StudentRef[] | null,
    )
    const application = firstRelation(
      row.applications as { reference: string } | { reference: string }[] | null,
    )

    const eventLabels: Record<string, string> = {
      application_received: 'Application received',
      otp_sent: 'OTP verification',
      status_changed: 'Application status update',
      app_fee_invoice_generated: 'Application fee invoice',
      tuition_invoice_generated: 'Tuition invoice',
      payment_confirmed: 'Payment confirmed',
      enrollment_confirmed: 'Enrollment confirmed',
      certificate_uploaded: 'Certificate uploaded',
      admission_letter_sent: 'Admission letter sent',
      password_reset: 'Password reset',
      contact_form: 'Contact form',
    }

    let providerErr: string | null = null
    if (row.status === 'failed' && row.provider_response && typeof row.provider_response === 'object') {
      const p = row.provider_response as Record<string, unknown>
      providerErr =
        (typeof p.message === 'string' && p.message) ||
        (typeof p.error === 'string' && p.error) ||
        null
    }

    rows.push({
      id: `n-${row.id}`,
      source: 'notification',
      channel: row.channel,
      status: row.status,
      sentAt: row.sent_at,
      title: eventLabels[row.event_type] ?? row.event_type.replace(/_/g, ' '),
      body:
        providerErr ??
        (application
          ? `Application ${application.reference}`
          : `System ${row.channel} notification`),
      recipient: row.recipient,
      errorMessage: providerErr,
      studentName: student?.full_name ?? null,
      studentPublicId: student?.student_id ?? null,
      studentProfileHref: student ? `/admin/students/${student.id}` : null,
    })
  }

  rows.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())

  return <AllMessageLogsClient logs={rows} />
}
