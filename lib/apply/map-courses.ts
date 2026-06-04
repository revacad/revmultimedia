import type { ApplyCourse } from '@/lib/apply/types'
import type { Course, Intake } from '@/lib/courses/types'
import { filterPublicOpenIntakes } from '@/lib/intakes/lifecycle'

export function mapApplyCourses(rows: unknown[]): ApplyCourse[] {
  return (rows ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const intakes = filterPublicOpenIntakes((r.intakes as Intake[] | null) ?? []).sort(
        (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
      )

    return {
      id: r.id as string,
      title: r.title as string,
      slug: r.slug as string,
      category: r.category as Course['category'],
      mode: r.mode as Course['mode'],
      tuition_fee_ghs: Number(r.tuition_fee_ghs),
      thumbnail_r2_key: (r.thumbnail_r2_key as string | null) ?? null,
      intakes,
    }
  })
}
