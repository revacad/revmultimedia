import { createAdminClient } from '@/lib/supabase/admin'
import { invalidateCourse } from '@/lib/redis/invalidate'

const DEFAULT_SLUG = 'graphic-design'

/**
 * Ensures a published Graphic Design course + open intake exist (dev/bootstrap).
 * Returns true if the course is available after this call.
 */
export async function ensureDefaultGraphicDesignCourse(): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('courses')
      .select('id, is_published')
      .eq('slug', DEFAULT_SLUG)
      .maybeSingle()

    let courseId = existing?.id

    if (!courseId) {
      const { data: created, error } = await supabase
        .from('courses')
        .insert({
          title: 'Graphic Design',
          slug: DEFAULT_SLUG,
          category: 'graphic_design',
          mode: 'in_person',
          tuition_fee_ghs: 2500,
          max_slots: 20,
          is_published: true,
          description:
            'Master visual communication. Typography, layout, brand systems, and digital design.',
        })
        .select('id')
        .single()

      if (error) {
        console.error('ensureDefaultGraphicDesignCourse: insert course failed', error)
        return false
      }
      courseId = created.id
    } else if (existing && !existing.is_published) {
      await supabase.from('courses').update({ is_published: true }).eq('id', courseId)
    }

    const { data: openIntake } = await supabase
      .from('intakes')
      .select('id')
      .eq('course_id', courseId)
      .eq('is_closed', false)
      .limit(1)
      .maybeSingle()

    if (!openIntake) {
      const { error: intakeError } = await supabase.from('intakes').insert({
        course_id: courseId,
        name: 'September 2025 Cohort',
        start_date: '2025-09-01',
        end_date: '2025-12-31',
        application_deadline: '2025-08-15',
        max_slots: 20,
        enrolled_count: 0,
        is_closed: false,
      })

      if (intakeError) {
        console.error('ensureDefaultGraphicDesignCourse: insert intake failed', intakeError)
        return false
      }
    }

    invalidateCourse(DEFAULT_SLUG)
    return true
  } catch (error) {
    console.error('ensureDefaultGraphicDesignCourse:', error)
    return false
  }
}
