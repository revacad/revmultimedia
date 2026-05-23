import AuthPageShell from '@/components/auth/AuthPageShell'
import { AuthLayout } from '@/components/auth/AuthLayout'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import { pickRandomQuote } from '@/lib/quotes'

export const metadata = {
  title: 'Reset Password — Rev Multimedia',
}

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const quote = pickRandomQuote()

  return (
    <AuthLayout quote={quote}>
      <AuthPageShell
        title="Reset your password"
        subtitle="Enter your Student ID or Application Reference and your registered email address"
      >
        <ForgotPasswordForm />
      </AuthPageShell>
    </AuthLayout>
  )
}
