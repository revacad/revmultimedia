import AuditLogPageClient, { type AuditLogRow } from '@/components/admin/audit/AuditLogPageClient'
import { requireSuperAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Audit Log — Admin',
}

export const dynamic = 'force-dynamic'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function AuditLogPage() {
  await requireSuperAdmin()

  const supabase = createAdminClient()

  const [{ data: logs }, { data: adminList }] = await Promise.all([
    supabase
      .from('audit_logs')
      .select('*, admins(full_name, email), students(full_name, student_id)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('admins').select('id, full_name').order('full_name'),
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
    students: firstRelation(
      row.students as AuditLogRow['students'] | AuditLogRow['students'][] | null,
    ),
  }))

  const actionTypes = [...new Set(rows.map((r) => r.action))].sort()

  return (
    <AuditLogPageClient
      logs={rows}
      admins={(adminList ?? []).map((a) => ({ id: a.id, full_name: a.full_name }))}
      actionTypes={actionTypes}
    />
  )
}
