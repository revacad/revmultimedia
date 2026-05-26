import Link from 'next/link'
import AuthPageShell from '@/components/auth/AuthPageShell'
import { AuthLayout } from '@/components/auth/AuthLayout'
import AdminForgotPasswordForm from '@/components/auth/AdminForgotPasswordForm'
import { pickRandomQuote } from '@/lib/quotes'

export const metadata = {
  title: 'Reset Admin Password — Rev Multimedia',
}

export const dynamic = 'force-dynamic'

export default function AdminForgotPasswordPage() {
  const quote = pickRandomQuote()

  return (
    <AuthLayout quote={quote}>
      <AuthPageShell
        title="Reset admin password"
        subtitle="Enter the email on your Rev Multimedia admin account"
      >
        <AdminForgotPasswordForm />
        <p
          style={{
            marginTop: '20px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          <Link href="/admin/login" style={{ color: '#C74A86', fontWeight: 600 }}>
            Back to admin sign in
          </Link>
        </p>
      </AuthPageShell>
    </AuthLayout>
  )
}
