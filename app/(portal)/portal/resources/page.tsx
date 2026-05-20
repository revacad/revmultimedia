import { redirect } from 'next/navigation'
import PortalResourcesList, {
  type PortalResource,
} from '@/components/portal/PortalResourcesList'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Resources — Portal',
}

export default async function PortalResourcesPage() {
  const user = await requirePortalUser()
  const supabase = await createServerClient()

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!student) redirect('/portal/application')

  const { data: resources } = await supabase
    .from('resources')
    .select('id, title, description, file_type, file_size, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const rows: PortalResource[] = (resources ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    file_type: r.file_type,
    file_size: r.file_size,
    created_at: r.created_at,
  }))

  return (
    <div className="mx-auto max-w-[960px] px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-[#1A1A2E]">Resources</h1>
        <p className="mt-1 font-body text-[15px] text-[#9898B8]">
          Materials and documents from Rev Multimedia
        </p>
      </header>

      <PortalResourcesList resources={rows} />
    </div>
  )
}
