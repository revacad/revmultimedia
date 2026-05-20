import AuthPageShell from '@/components/auth/AuthPageShell'
import PortalLoginForm from '@/components/auth/PortalLoginForm'

export const metadata = {
  title: 'Login — Rev Multimedia',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const params = await searchParams
  const resetSuccess = params.reset === 'success'

  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Enter your Student ID or Application Reference"
      footerNote={resetSuccess ? 'Your password has been reset. You can sign in now.' : undefined}
    >
      <PortalLoginForm />
    </AuthPageShell>
  )
}
