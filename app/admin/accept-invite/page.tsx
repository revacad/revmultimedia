import Link from 'next/link'
import AuthPageShell from '@/components/auth/AuthPageShell'
import AcceptInviteForm from '@/components/auth/AcceptInviteForm'
import { validateAdminInviteToken } from '@/actions/admin'

export const metadata = {
  title: 'Accept Invitation — Rev Multimedia Academy',
}

export const dynamic = 'force-dynamic'

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const validation = token ? await validateAdminInviteToken(token) : { valid: false }

  if (!token || !validation.valid) {
    return (
      <AuthPageShell title="Invalid invitation" subtitle="This link is invalid or has expired">
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '15px',
            color: '#5A5A7A',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          Please contact your administrator to request a new invitation.
        </p>
        <Link
          href="mailto:info@revmultimediagh.com"
          style={{
            display: 'inline-block',
            color: '#C74A86',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          Contact admin
        </Link>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell title="Set your password" subtitle="Create your admin account to continue">
      <AcceptInviteForm token={token} fullName={validation.fullName} />
    </AuthPageShell>
  )
}
