const PORTAL_SECTIONS = [
  { href: '/portal/dashboard', label: 'Dashboard' },
  { href: '/portal/invoices', label: 'Invoices' },
  { href: '/portal/profile', label: 'Profile' },
] as const

export function getPortalSectionLabel(pathname: string): string {
  const match = PORTAL_SECTIONS.find(
    (section) => pathname === section.href || pathname.startsWith(`${section.href}/`),
  )
  return match?.label ?? 'Portal'
}

export { PORTAL_SECTIONS }
