'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  cancelAdminInvite,
  inviteAdmin,
  resendAdminInvite,
  toggleAdminActive,
} from '@/actions/admin'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { formatPaymentDateTime } from '@/lib/payments/format'

export type AdminRow = {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  invited_by_admin: { full_name: string } | null
}

export type PendingInviteRow = {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  expires_at: string
}

interface AdminUsersPageClientProps {
  admins: AdminRow[]
  pendingInvites: PendingInviteRow[]
}

export default function AdminUsersPageClient({
  admins,
  pendingInvites,
}: AdminUsersPageClientProps) {
  const router = useRouter()
  const [showInvite, setShowInvite] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function refresh() {
    router.refresh()
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await inviteAdmin({ fullName, email, role })
      if (result.error) {
        setError(result.error)
        return
      }
      setFullName('')
      setEmail('')
      setRole('admin')
      setShowInvite(false)
      refresh()
    })
  }

  function handleToggle(adminId: string, currentlyActive: boolean) {
    startTransition(async () => {
      await toggleAdminActive(adminId, !currentlyActive)
      refresh()
    })
  }

  function handleResend(inviteId: string) {
    startTransition(async () => {
      await resendAdminInvite(inviteId)
      refresh()
    })
  }

  function handleCancel(inviteId: string) {
    startTransition(async () => {
      await cancelAdminInvite(inviteId)
      refresh()
    })
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Admin Management</h1>
          <p className="mt-1 font-body text-sm text-[#9898B8]">Invite and manage dashboard users</p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite((v) => !v)}
          className="rounded-full bg-primary px-5 py-2.5 font-body text-sm font-semibold text-white"
        >
          Invite Admin
        </button>
      </header>

      {showInvite && (
        <section className="mb-8 rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Invite new admin</h2>
          <form onSubmit={handleInvite} className="grid max-w-md gap-4">
            <div>
              <AdminLabel htmlFor="invite-name">Full name</AdminLabel>
              <input
                id="invite-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={adminFieldClassName}
              />
            </div>
            <div>
              <AdminLabel htmlFor="invite-email">Email</AdminLabel>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={adminFieldClassName}
              />
            </div>
            <div>
              <AdminLabel htmlFor="invite-role">Role</AdminLabel>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'superadmin')}
                className={adminFieldClassName}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
            {error && <p className="font-body text-sm text-[#E84A4A]">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-primary px-6 py-2.5 font-body text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? 'Sending…' : 'Send Invite'}
            </button>
          </form>
        </section>
      )}

      <section className="mb-8 rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Active admins</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left font-body text-sm">
            <thead>
              <tr className="border-b border-[#EFEFF5] text-xs uppercase text-[#9898B8]">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((row) => (
                <tr key={row.id} className="border-b border-[#EFEFF5] last:border-0">
                  <td className="py-3 pr-4 font-medium text-[#1A1A2E]">{row.full_name}</td>
                  <td className="py-3 pr-4 text-[#5A5A7A]">{row.email}</td>
                  <td className="py-3 pr-4 capitalize text-[#5A5A7A]">{row.role}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.is_active
                          ? 'bg-[#EBF9F8] text-[#1E9990]'
                          : 'bg-[#FDECEC] text-[#E84A4A]'
                      }`}
                    >
                      {row.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[#9898B8]">
                    {formatPaymentDateTime(row.created_at)}
                  </td>
                  <td className="py-3">
                    {row.role === 'superadmin' ? (
                      <span className="text-xs text-[#9898B8]">—</span>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleToggle(row.id, row.is_active)}
                        className="font-body text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        {row.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Pending invites</h2>
        {pendingInvites.length === 0 ? (
          <p className="font-body text-sm text-[#9898B8]">No pending invites.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left font-body text-sm">
              <thead>
                <tr className="border-b border-[#EFEFF5] text-xs uppercase text-[#9898B8]">
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Invited</th>
                  <th className="pb-3 pr-4">Expires</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvites.map((row) => (
                  <tr key={row.id} className="border-b border-[#EFEFF5] last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-[#1A1A2E]">{row.full_name}</p>
                      <p className="text-[#9898B8]">{row.email}</p>
                    </td>
                    <td className="py-3 pr-4 capitalize text-[#5A5A7A]">{row.role}</td>
                    <td className="py-3 pr-4 text-[#9898B8]">
                      {formatPaymentDateTime(row.created_at)}
                    </td>
                    <td className="py-3 pr-4 text-[#9898B8]">
                      {formatPaymentDateTime(row.expires_at)}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleResend(row.id)}
                          className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                        >
                          Resend
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleCancel(row.id)}
                          className="text-xs font-semibold text-[#E84A4A] hover:underline disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
