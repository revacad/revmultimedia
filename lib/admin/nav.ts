import { hasFinanceAccess, isStaffAdmin } from '@/lib/auth/permissions'
import type { AdminRole } from '@/lib/auth/admin'

export type NavIconName =
  | 'dashboard'
  | 'files'
  | 'users'
  | 'comms'
  | 'folder'
  | 'chart'
  | 'payments'
  | 'layers'
  | 'courses'
  | 'calendar'
  | 'tag'
  | 'shield'
  | 'audit'
  | 'compliance'
  | 'settings'
  | 'log'

export type NavLink = {
  href: string
  label: string
  icon: NavIconName
}

export type NavGroup = {
  label: string
  links: NavLink[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    links: [{ href: '/admin', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    label: 'Admissions',
    links: [
      { href: '/admin/applications', label: 'Applications', icon: 'files' },
      { href: '/admin/students', label: 'Students', icon: 'users' },
    ],
  },
  {
    label: 'Academics',
    links: [
      { href: '/admin/courses', label: 'Courses', icon: 'courses' },
      { href: '/admin/intakes', label: 'Intakes', icon: 'calendar' },
    ],
  },
  {
    label: 'Finance',
    links: [
      { href: '/admin/payments', label: 'Payments', icon: 'payments' },
      { href: '/admin/payment-types', label: 'Payment Types', icon: 'layers' },
      { href: '/admin/reports', label: 'Reports', icon: 'chart' },
    ],
  },
  {
    label: 'Marketing',
    links: [{ href: '/admin/promo-codes', label: 'Promo Codes', icon: 'tag' }],
  },
  {
    label: 'Communication',
    links: [
      { href: '/admin/communications', label: 'Communications', icon: 'comms' },
      { href: '/admin/communications/logs', label: 'Message log', icon: 'log' },
      { href: '/admin/resources', label: 'Resources', icon: 'folder' },
    ],
  },
  {
    label: 'System',
    links: [
      { href: '/admin/admins', label: 'Admin Users', icon: 'shield' },
      { href: '/admin/audit-log', label: 'Audit Log', icon: 'audit' },
      { href: '/admin/compliance', label: 'Data & Compliance', icon: 'compliance' },
      { href: '/admin/settings', label: 'Settings', icon: 'settings' },
    ],
  },
]

export type AdminNavItem = NavLink & { group: string }

export function filterGroupsForRole(role: AdminRole): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => {
      if (group.label === 'System') return role === 'superadmin'
      if (group.label === 'Overview') return true
      if (group.label === 'Finance') return hasFinanceAccess(role)
      if (hasFinanceAccess(role) && !isStaffAdmin(role)) {
        if (link.href === '/admin/communications/logs') return true
        return false
      }
      return isStaffAdmin(role)
    }),
  })).filter((group) => group.links.length > 0)
}

export function getAdminNavItems(role: AdminRole): AdminNavItem[] {
  return filterGroupsForRole(role).flatMap((group) =>
    group.links.map((link) => ({ ...link, group: group.label })),
  )
}
