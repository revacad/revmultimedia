import { notFound } from 'next/navigation'
import ApplicationDetailView from '@/components/admin/applications/ApplicationDetailView'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapApplicationDetail } from '@/lib/applications/map'

export const dynamic = 'force-dynamic'

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ApplicationDetailPageProps) {
  const { id } = await params
  return {
    title: `Application ${id.slice(0, 8)}… — Admin`,
  }
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const { data: application, error } = await supabase
    .from('applications')
    .select(
      `
      *,
      courses(id, title, category, mode, tuition_fee_ghs),
      intakes(id, name, start_date, end_date, max_slots, enrolled_count),
      documents(*),
      invoices(*, payment_types(label), installments(amount_ghs)),
      admin_notes(*, admins(full_name))
    `,
    )
    .eq('id', id)
    .single()

  if (error || !application) {
    notFound()
  }

  const { data: studentRow } = await supabase
    .from('students')
    .select('id')
    .eq('application_id', id)
    .maybeSingle()

  return (
    <ApplicationDetailView
      application={mapApplicationDetail(application as Record<string, unknown>)}
      hasStudentRecord={Boolean(studentRow)}
    />
  )
}
