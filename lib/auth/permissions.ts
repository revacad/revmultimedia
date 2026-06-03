import type { AdminRole } from '@/lib/auth/admin'

const STAFF_ROLES: AdminRole[] = ['admin', 'superadmin']
const FINANCE_ROLES: AdminRole[] = ['admin', 'superadmin', 'accounts']

/** Full admin access (not accounts). */
export function isStaffAdmin(role: AdminRole): boolean {
  return STAFF_ROLES.includes(role)
}

/** Payments, payment types, reports, communication logs. */
export function hasFinanceAccess(role: AdminRole): boolean {
  return FINANCE_ROLES.includes(role)
}

function normalizeAdminPath(pathname: string): string {
  const path = pathname.split('?')[0]?.replace(/\/$/, '') || '/admin'
  return path === '' ? '/admin' : path
}

/**
 * Whether this admin role may open the pathname. Layout uses this before rendering children.
 */
export function canAccessAdminPath(role: AdminRole, pathname: string): boolean {
  const path = normalizeAdminPath(pathname)

  if (path === '/admin' || path === '/admin/profile') return true

  if (hasFinanceAccess(role)) {
    if (path.startsWith('/admin/payments')) return true
    if (path.startsWith('/admin/payment-types')) return true
    if (path.startsWith('/admin/reports')) return true
    if (path === '/admin/communications/logs' || path.startsWith('/admin/communications/logs/')) {
      return true
    }
  }

  if (!isStaffAdmin(role)) return false

  if (path.startsWith('/admin/applications')) return true
  if (path.startsWith('/admin/students')) return true
  if (path.startsWith('/admin/courses')) return true
  if (path.startsWith('/admin/intakes')) return true
  if (path.startsWith('/admin/promo-codes')) return true
  if (path.startsWith('/admin/communications')) return true
  if (path.startsWith('/admin/resources')) return true

  if (role === 'superadmin') {
    if (path.startsWith('/admin/admins')) return true
    if (path.startsWith('/admin/audit-log')) return true
    if (path.startsWith('/admin/compliance')) return true
    if (path.startsWith('/admin/settings')) return true
  }

  return false
}
