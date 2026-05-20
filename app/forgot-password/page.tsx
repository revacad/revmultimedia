import AuthPageShell from '@/components/auth/AuthPageShell'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata = {
  title: 'Reset Password — Rev Multimedia',
}

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      title="Reset your password"
      subtitle="Enter your Student ID or Application Reference and your registered email address"
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  )
}
