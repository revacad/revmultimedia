import { getCategoryLabel } from '@/lib/courses/categories'
import type { CourseCategory } from '@/lib/courses/categories'
import type { CourseMode } from '@/lib/courses/types'

export const MODE_LABELS: Record<CourseMode, string> = {
  online: 'Online',
  in_person: 'In-Person',
  hybrid: 'Hybrid',
}

export function formatCategory(category: CourseCategory | string): string {
  return getCategoryLabel(category)
}

export function formatMode(mode: CourseMode): string {
  return MODE_LABELS[mode]
}
