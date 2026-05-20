import StudentsPageClient, {
  type StudentListRow,
} from '@/components/admin/students/StudentsPageClient'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Students — Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminStudentsPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('students')
    .select(
      `
      id, student_id, full_name, real_email, phone,
      country, created_at, is_active,
      enrollments(
        status,
        courses(title, category)
      )
    `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/students] fetch failed', error)
  }

  const students: StudentListRow[] = (data ?? []).map((row) => ({
    id: row.id,
    student_id: row.student_id,
    full_name: row.full_name,
    real_email: row.real_email,
    phone: row.phone,
    country: row.country,
    created_at: row.created_at,
    is_active: row.is_active,
    enrollments: (row.enrollments as unknown as StudentListRow['enrollments']) ?? [],
  }))

  return <StudentsPageClient students={students} />
}
