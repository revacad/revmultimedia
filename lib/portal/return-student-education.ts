import type { SupabaseClient } from '@supabase/supabase-js'
import type { QualificationOption } from '@/lib/apply/types'

export type ReturnStudentEducation = {
  qualification: QualificationOption
  institution: string
  yearCompleted: number
  priorExperience?: string
}

const QUALIFICATIONS: QualificationOption[] = [
  'wassce',
  'hnd',
  'degree',
  'masters',
  'other',
]

function mapApplicationRow(row: {
  qualification: string
  institution: string
  year_completed: number
  prior_experience: string | null
}): ReturnStudentEducation | null {
  const qualification = row.qualification as QualificationOption
  if (!QUALIFICATIONS.includes(qualification)) return null
  if (!row.institution?.trim()) return null
  const yearCompleted = Number(row.year_completed)
  if (!Number.isFinite(yearCompleted)) return null

  return {
    qualification,
    institution: row.institution.trim(),
    yearCompleted,
    priorExperience: row.prior_experience?.trim() || undefined,
  }
}

export async function fetchReturnStudentEducation(
  supabase: SupabaseClient,
  student: { application_id: string | null; auth_user_id: string },
): Promise<ReturnStudentEducation | null> {
  const select =
    'qualification, institution, year_completed, prior_experience, created_at'

  if (student.application_id) {
    const { data } = await supabase
      .from('applications')
      .select(select)
      .eq('id', student.application_id)
      .maybeSingle()

    const mapped = data ? mapApplicationRow(data) : null
    if (mapped) return mapped
  }

  const { data: latest } = await supabase
    .from('applications')
    .select(select)
    .eq('auth_user_id', student.auth_user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return latest ? mapApplicationRow(latest) : null
}
