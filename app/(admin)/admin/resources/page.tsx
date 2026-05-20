import ResourcesPageClient, {
  type ResourceListRow,
} from '@/components/admin/resources/ResourcesPageClient'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Resources — Admin',
}

export const dynamic = 'force-dynamic'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function AdminResourcesPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const [{ data: resources, error }, { data: courses }, { data: intakes }] = await Promise.all([
    supabase
      .from('resources')
      .select(`
        *,
        courses(title),
        intakes(name),
        admins(full_name)
      `)
      .order('created_at', { ascending: false }),
    supabase.from('courses').select('id, title').eq('is_published', true).order('title'),
    supabase
      .from('intakes')
      .select('id, name, course_id')
      .eq('is_closed', false)
      .order('name'),
  ])

  if (error) {
    console.error('[admin/resources] fetch failed', error)
  }

  const rows: ResourceListRow[] = (resources ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    file_name: row.file_name,
    file_type: row.file_type,
    file_size: row.file_size,
    visibility: row.visibility,
    created_at: row.created_at,
    courses: firstRelation(row.courses as ResourceListRow['courses'] | ResourceListRow['courses'][]),
    intakes: firstRelation(row.intakes as ResourceListRow['intakes'] | ResourceListRow['intakes'][]),
    admins: firstRelation(row.admins as ResourceListRow['admins'] | ResourceListRow['admins'][]),
  }))

  return (
    <ResourcesPageClient
      resources={rows}
      courses={courses ?? []}
      intakes={intakes ?? []}
    />
  )
}
