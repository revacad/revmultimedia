import AuthPageShell from '@/components/auth/AuthPageShell'
import { AuthLayout } from '@/components/auth/AuthLayout'
import LoginForm from '@/components/auth/LoginForm'
import { pickRandomQuote } from '@/lib/quotes'

export const metadata = {
  title: 'Admin Login — Rev Multimedia',
}

export const dynamic = 'force-dynamic'

const LOGIN_MESSAGES: Record<string, string> = {
  session:
    'Your session was ended for security reasons. Please sign in again.',
  not_admin:
    'This account does not have admin access. Use the student portal or an admin invite link.',
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; reason?: string }>
}) {
  const params = await searchParams
  const quote = pickRandomQuote()
  const resetSuccess = params.reset === 'success'
  const notice =
    params.reason && LOGIN_MESSAGES[params.reason]
      ? LOGIN_MESSAGES[params.reason]
      : null

  return (
    <AuthLayout quote={quote}>
      <AuthPageShell
        title="Welcome back"
        subtitle="Sign in to manage Rev Multimedia"
        footerNote="Admin access only"
      >
        <LoginForm resetSuccess={resetSuccess} notice={notice} />
      </AuthPageShell>
    </AuthLayout>
  )
}
