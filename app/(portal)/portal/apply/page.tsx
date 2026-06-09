import { redirect } from 'next/navigation'
import ReturnStudentApplyForm from '@/components/portal/ReturnStudentApplyForm'
import { fetchCachedApplyCourses } from '@/lib/apply/fetch-cached-apply-courses'
import { fetchReturnStudentEducation } from '@/lib/portal/return-student-education'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import { createServerClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Apply for another course - Portal',
}

export const dynamic = 'force-dynamic'

export default async function PortalApplyPage({
  searchParams,
}: {
  searchParams?: Promise<{ course?: string; intake?: string }>
}) {
  const user = await requirePortalUser()
  const supabase = await createServerClient()
  const rawParams = (await searchParams) ?? {}

  const { data: studentRows } = await supabase
    .from('students')
    .select('id, student_id, full_name, real_email, phone, is_active, application_id, auth_user_id')
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const student = studentRows?.[0] ?? null

  if (!student?.is_active) {
    redirect('/portal/dashboard')
  }

  const priorEducation = await fetchReturnStudentEducation(supabase, {
    application_id: student.application_id,
    auth_user_id: student.auth_user_id,
  })

  if (!priorEducation) {
    redirect('/portal/dashboard')
  }

  const courses = await fetchCachedApplyCourses()

  return (
    <div className="px-0 py-2">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E] sm:text-[28px]">
          Apply for another course
        </h1>
        <p className="mt-2 font-body text-[15px] text-[#9898B8]">
          Choose a programme and intake. Your name and contact details are taken from your student
          record.
        </p>
      </header>
      <ReturnStudentApplyForm
        courses={courses}
        initialCourseId={rawParams.course}
        initialIntakeId={rawParams.intake}
        student={{
          fullName: student.full_name,
          realEmail: student.real_email,
          phone: student.phone,
          studentId: student.student_id,
        }}
      />
    </div>
  )
}
