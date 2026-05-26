import type { ApplyCourse } from '@/lib/apply/types'
import type { Intake } from '@/lib/courses/types'

export function intakeSlotsRemaining(intake: Intake): number | null {
  if (intake.max_slots == null) return null
  return Math.max(0, intake.max_slots - intake.enrolled_count)
}

export function isIntakeFull(intake: Intake): boolean {
  const remaining = intakeSlotsRemaining(intake)
  return remaining !== null && remaining <= 0
}

export function courseHasOpenIntake(course: ApplyCourse): boolean {
  return course.intakes.some((i) => !isIntakeFull(i))
}

export function openIntakeCount(course: ApplyCourse): number {
  return course.intakes.filter((i) => !isIntakeFull(i)).length
}
