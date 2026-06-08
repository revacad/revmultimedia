import DataCompliancePageClient, {
  type DeletionRequestRow,
} from '@/components/admin/compliance/DataCompliancePageClient'
import { requireSuperAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Data & Compliance - Admin',
}

export const dynamic = 'force-dynamic'

export default async function DataCompliancePage() {
  await requireSuperAdmin()

  const supabase = createAdminClient()
  const { data: requests, error } = await supabase
    .from('deletion_requests')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })

  if (error) {
    console.error('[admin/compliance] fetch failed', {
      message: error.message,
      code: error.code,
    })
  }

  const rows: DeletionRequestRow[] = (requests ?? []).map((row) => ({
    id: row.id as string,
    student_name: row.student_name as string,
    student_email: row.student_email as string,
    requested_at: row.requested_at as string,
  }))

  return <DataCompliancePageClient requests={rows} />
}
