import { redirect } from 'next/navigation'
import PortalNavbar from '@/components/portal/PortalNavbar'
import PortalSecondaryNav from '@/components/portal/PortalSecondaryNav'
import { createServerClient } from '@/lib/supabase/server'
import { firstName } from '@/lib/portal/timeline'

export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: application } = await supabase
    .from('applications')
    .select('full_name')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  const { data: student } = await supabase
    .from('students')
    .select('full_name')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  const displayName = student?.full_name ?? application?.full_name ?? 'Student'
  const isStudent = Boolean(student)

  return (
    <div className="flex min-h-screen flex-col">
      <PortalNavbar displayName={firstName(displayName)} />
      <PortalSecondaryNav isStudent={isStudent} />
      <main className="min-h-screen flex-1 bg-[#F0F2F8] p-6">{children}</main>
    </div>
  )
}
