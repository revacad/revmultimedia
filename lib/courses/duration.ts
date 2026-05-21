import type { Course } from '@/lib/courses/types'

export function weeksBetweenDates(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(ms / (7 * 24 * 60 * 60 * 1000)))
}

export function formatCourseDuration(course: Course): string {
  if (course.duration_weeks) {
    return `${course.duration_weeks} weeks`
  }
  if (course.duration) {
    return course.duration
  }
  return '12 weeks'
}
