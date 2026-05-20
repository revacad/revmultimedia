const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/applications': 'Applications',
  '/admin/students': 'Students',
  '/admin/reports': 'Reports',
  '/admin/payments': 'Payments',
  '/admin/courses': 'Courses',
  '/admin/intakes': 'Intakes',
  '/admin/promo-codes': 'Promo Codes',
  '/admin/settings': 'Settings',
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
