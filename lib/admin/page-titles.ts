const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/applications': 'Applications',
  '/admin/students': 'Students',
  '/admin/communications': 'Communications',
  '/admin/resources': 'Resources',
  '/admin/reports': 'Reports',
  '/admin/payments': 'Payments',
  '/admin/payment-types': 'Payment Types',
  '/admin/courses': 'Courses',
  '/admin/intakes': 'Intakes',
  '/admin/promo-codes': 'Promo Codes',
  '/admin/settings': 'Settings',
  '/admin/profile': 'Profile',
}

export function getAdminPageTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname]

  for (const [path, title] of Object.entries(TITLES)) {
    if (path !== '/admin' && pathname.startsWith(`${path}/`)) {
      return title
    }
  }

  return 'Admin'
}
