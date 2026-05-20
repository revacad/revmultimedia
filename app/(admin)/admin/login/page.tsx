import AuthPageShell from '@/components/auth/AuthPageShell'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Admin Login — Rev Multimedia',
}

export default function AdminLoginPage() {
  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Sign in to manage Rev Multimedia"
      footerNote="Admin access only"
    >
      <LoginForm />
    </AuthPageShell>
  )
}
