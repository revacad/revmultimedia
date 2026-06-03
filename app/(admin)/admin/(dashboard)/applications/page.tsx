import ApplicationsPageClient from '@/components/admin/applications/ApplicationsPageClient'
import { mapApplicationListRow } from '@/lib/applications/map'
import { requireStaffAdmin } from '@/lib/auth/requireAdmin'
import { supabaseErrorMessage } from '@/lib/errors/query'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Applications — Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage() {
  await requireStaffAdmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id, reference, full_name, real_email, phone,
      country, status, app_fee_paid, created_at,
      students:students!students_application_id_fkey(student_id),
      returning_student:students!applications_returning_student_id_fkey(student_id),
      courses(title, category),
      intakes(name, start_date)
    `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/applications] fetch failed', {
      message: (error as { message?: string }).message,
      code: (error as { code?: string }).code,
      details: (error as { details?: string }).details,
      hint: (error as { hint?: string }).hint,
    })
    console.error('[admin/applications] fetch failed', {
      message: error.message,
      code: error.code,
    })
  }

  const fetchError = error ? supabaseErrorMessage(error, 'admin/applications') : null

  const applications = (data ?? []).map((row) =>
    mapApplicationListRow(row as Record<string, unknown>),
  )

  return <ApplicationsPageClient applications={applications} fetchError={fetchError} />
}
