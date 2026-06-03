import { redirect } from 'next/navigation'
import { getAdminSession, type AdminRole } from '@/lib/auth/admin'

export async function requireAdminPage(): Promise<{
  userId: string
  role: AdminRole
}> {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }
  return session
}
