import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PortalApplicationRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string }>
}) {
  const rawParams = (await searchParams) ?? {}
  const query = rawParams.applicationId
    ? `?applicationId=${encodeURIComponent(rawParams.applicationId)}`
    : ''
  redirect(`/portal/dashboard${query}`)
}
