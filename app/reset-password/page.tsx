import Link from 'next/link'
import AuthPageShell from '@/components/auth/AuthPageShell'
import { AuthLayout } from '@/components/auth/AuthLayout'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import { pickRandomQuote } from '@/lib/quotes'
import { redis } from '@/lib/redis/client'

export const metadata = {
  title: 'Set New Password — Rev Multimedia',
}

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = params.token?.trim() ?? ''
  const quote = pickRandomQuote()

  if (!token) {
    return (
      <AuthLayout quote={quote}>
        <AuthPageShell
          title="Invalid link"
          subtitle="This password reset link is missing or invalid."
        >
          <Link href="/forgot-password" style={{ color: '#C74A86', fontFamily: 'DM Sans, sans-serif' }}>
            Request a new reset link
          </Link>
        </AuthPageShell>
      </AuthLayout>
    )
  }

  const payload = await redis.get<{ auth_user_id: string }>(`password_reset:${token}`)

  if (!payload?.auth_user_id) {
    return (
      <AuthLayout quote={quote}>
        <AuthPageShell
          title="Link expired"
          subtitle="This password reset link is invalid or has expired."
        >
          <Link href="/forgot-password" style={{ color: '#C74A86', fontFamily: 'DM Sans, sans-serif' }}>
            Request a new reset link
          </Link>
        </AuthPageShell>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout quote={quote}>
      <AuthPageShell title="Choose a new password" subtitle="Enter a new password for your account">
        <ResetPasswordForm token={token} />
      </AuthPageShell>
    </AuthLayout>
  )
}
