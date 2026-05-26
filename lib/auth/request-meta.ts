export function getRequestMetaFromHeaders(headersList: Headers): {
  ip: string
  userAgent: string
} {
  return {
    ip:
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'anonymous',
    userAgent: headersList.get('user-agent') ?? '',
  }
}
