import AdminUsersPageClient, {
  type AdminRow,
  type PendingInviteRow,
} from '@/components/admin/admins/AdminUsersPageClient'
import { requireSuperAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Admin Users — Admin',
}

export const dynamic = 'force-dynamic'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function AdminUsersPage() {
  await requireSuperAdmin()

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const [{ data: admins }, { data: pendingInvites }] = await Promise.all([
    supabase
      .from('admins')
      .select('*, invited_by_admin:created_by(full_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('admin_invites')
      .select('*')
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false }),
  ])

  const adminRows: AdminRow[] = (admins ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    is_active: row.is_active,
    created_at: row.created_at,
    invited_by_admin: firstRelation(
      row.invited_by_admin as AdminRow['invited_by_admin'] | AdminRow['invited_by_admin'][] | null,
    ),
  }))

  const inviteRows: PendingInviteRow[] = (pendingInvites ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    created_at: row.created_at,
    expires_at: row.expires_at,
  }))

  return <AdminUsersPageClient admins={adminRows} pendingInvites={inviteRows} />
}
