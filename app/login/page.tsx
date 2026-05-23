import AuthPageShell from '@/components/auth/AuthPageShell'
import { AuthLayout } from '@/components/auth/AuthLayout'
import PortalLoginForm from '@/components/auth/PortalLoginForm'
import { pickRandomQuote } from '@/lib/quotes'

export const metadata = {
  title: 'Login — Rev Multimedia',
}

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const params = await searchParams
  const resetSuccess = params.reset === 'success'
  const quote = pickRandomQuote()

  return (
    <AuthLayout quote={quote}>
      <AuthPageShell
        title="Welcome back"
        subtitle="Enter your Student ID or Application Reference"
        footerNote={resetSuccess ? 'Your password has been reset. You can sign in now.' : undefined}
      >
        <PortalLoginForm />
      </AuthPageShell>
    </AuthLayout>
  )
}
