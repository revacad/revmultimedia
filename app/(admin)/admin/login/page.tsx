import AuthPageShell from '@/components/auth/AuthPageShell'
import { AuthLayout } from '@/components/auth/AuthLayout'
import LoginForm from '@/components/auth/LoginForm'
import { pickRandomQuote } from '@/lib/quotes'

export const metadata = {
  title: 'Admin Login — Rev Multimedia',
}

export const dynamic = 'force-dynamic'

export default function AdminLoginPage() {
  const quote = pickRandomQuote()

  return (
    <AuthLayout quote={quote}>
      <AuthPageShell
        title="Welcome back"
        subtitle="Sign in to manage Rev Multimedia"
        footerNote="Admin access only"
      >
        <LoginForm />
      </AuthPageShell>
    </AuthLayout>
  )
}
