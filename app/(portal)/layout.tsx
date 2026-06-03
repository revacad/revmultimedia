import PortalNavbar from '@/components/portal/PortalNavbar'
import PortalSecondaryNav from '@/components/portal/PortalSecondaryNav'
import PortalMobileDock from '@/components/portal/PortalMobileDock'
import { createServerClient } from '@/lib/supabase/server'
import { getPortalAuthUser } from '@/lib/portal/session'
import { firstName } from '@/lib/portal/timeline'

export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getPortalAuthUser()
  const supabase = await createServerClient()

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

  return (
    <div className="flex min-h-screen flex-col bg-[#F0F2F8]">
      <PortalNavbar displayName={firstName(displayName)} />
      <PortalSecondaryNav />
      <main className="min-h-0 flex-1 overflow-x-hidden pb-28 md:pb-6">
        <div className="mx-auto w-full max-w-[900px] px-4 py-5 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
      <PortalMobileDock />
    </div>
  )
}
