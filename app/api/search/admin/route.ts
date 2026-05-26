import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { searchQuerySchema } from '@/lib/validations/api'

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawQ = request.nextUrl.searchParams.get('q') ?? ''
  const parsed = searchQuerySchema.safeParse({ q: rawQ })
  if (!parsed.success) {
    return NextResponse.json({ results: { students: [], applications: [], courses: [] } })
  }
  const query = parsed.data.q

  const [students, applications, courses] = await Promise.all([
    adminClient
      .from('students')
      .select('id, student_id, full_name, real_email')
      .textSearch('search_vector', query, { type: 'websearch', config: 'simple' })
      .limit(4),
    adminClient
      .from('applications')
      .select('id, reference, full_name, status')
      .textSearch('search_vector', query, { type: 'websearch', config: 'simple' })
      .limit(4),
    adminClient
      .from('courses')
      .select('id, title, slug, category')
      .textSearch('search_vector', query, { type: 'websearch', config: 'english' })
      .limit(3),
  ])

  return NextResponse.json({
    results: {
      students: students.data ?? [],
      applications: applications.data ?? [],
      courses: courses.data ?? [],
    },
  })
}
