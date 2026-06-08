import AuditLogPageClient, { type AuditLogRow } from '@/components/admin/audit/AuditLogPageClient'
import { ADMIN_PAGE_SIZE, adminListRange, parseAdminPage } from '@/lib/admin/pagination'
import { requireSuperAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Audit Log - Admin',
}

export const dynamic = 'force-dynamic'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await requireSuperAdmin()

  const { page: pageParam } = await searchParams
  const page = parseAdminPage(pageParam)
  const { from, to } = adminListRange(page)

  const supabase = createAdminClient()

  const [{ data: logs, count }, { data: adminList }, { data: actionRows }] = await Promise.all([
    supabase
      .from('audit_logs')
      .select('*, admins(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase.from('admins').select('id, full_name').order('full_name'),
    supabase.from('audit_logs').select('action').order('created_at', { ascending: false }).limit(500),
  ])

  const rows: AuditLogRow[] = (logs ?? []).map((row) => ({
    id: row.id,
    admin_id: row.admin_id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    old_value: row.old_value,
    new_value: row.new_value,
    created_at: row.created_at,
    admins: firstRelation(row.admins as AuditLogRow['admins'] | AuditLogRow['admins'][] | null),
    students: null,
  }))

  const actionTypes = [...new Set((actionRows ?? []).map((row) => row.action))].sort()

  return (
    <AuditLogPageClient
      logs={rows}
      admins={(adminList ?? []).map((a) => ({ id: a.id, full_name: a.full_name }))}
      actionTypes={actionTypes}
      currentPage={page}
      totalCount={count ?? 0}
      pageSize={ADMIN_PAGE_SIZE}
    />
  )
}
