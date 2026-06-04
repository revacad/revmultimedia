import Link from 'next/link'
import AuthPageShell from '@/components/auth/AuthPageShell'
import { AuthLayout } from '@/components/auth/AuthLayout'
import AcceptInviteForm from '@/components/auth/AcceptInviteForm'
import { validateAdminInviteToken } from '@/actions/admin'
import { pickRandomQuote } from '@/lib/quotes'

export const metadata = {
  title: 'Accept Invitation — Rev Multimedia',
}

export const dynamic = 'force-dynamic'

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const quote = pickRandomQuote()
  const validation = token ? await validateAdminInviteToken(token) : { valid: false }

  if (!token || !validation.valid) {
    return (
      <AuthLayout quote={quote} viewportLocked>
        <AuthPageShell
          showBrand={false}
          compact
          title="Invalid invitation"
          subtitle="This link is invalid or has expired"
        >
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
      </AuthLayout>
    )
  }

  return (
    <AuthLayout quote={quote} viewportLocked>
      <AuthPageShell
        showBrand={false}
        compact
        title="Set your password"
        subtitle="Create your admin account to continue"
        footerNote="Admin access only"
      >
        <AcceptInviteForm token={token} fullName={validation.fullName} />
      </AuthPageShell>
    </AuthLayout>
  )
}
