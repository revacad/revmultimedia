import type { Intake } from '@/lib/courses/types'

export type IntakeLifecycleStatus = 'open' | 'closed' | 'ended'

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Intake visible for public apply flows: not manually closed and end date not passed. */
export function isPublicOpenIntake(
  intake: Pick<Intake, 'is_closed' | 'end_date'>,
  today: string = todayDateString(),
): boolean {
  return !intake.is_closed && intake.end_date >= today
}

export function filterPublicOpenIntakes<T extends Pick<Intake, 'is_closed' | 'end_date'>>(
  intakes: T[],
  today: string = todayDateString(),
): T[] {
  return intakes.filter((i) => isPublicOpenIntake(i, today))
}

export function hasPublicOpenIntakes(
  intakes: Pick<Intake, 'is_closed' | 'end_date'>[],
  today: string = todayDateString(),
): boolean {
  return intakes.some((i) => isPublicOpenIntake(i, today))
}

export function getIntakeLifecycleStatus(
  intake: Pick<Intake, 'is_closed' | 'end_date'>,
  today: string = todayDateString(),
): IntakeLifecycleStatus {
  if (intake.is_closed) return 'closed'
  if (intake.end_date < today) return 'ended'
  return 'open'
}

export function isIntakeEndedNotClosed(
  intake: Pick<Intake, 'is_closed' | 'end_date'>,
  today: string = todayDateString(),
): boolean {
  return getIntakeLifecycleStatus(intake, today) === 'ended'
}

export function intakeLifecycleStatusLabel(status: IntakeLifecycleStatus): string {
  switch (status) {
    case 'open':
      return 'Open'
    case 'closed':
      return 'Closed'
    case 'ended':
      return 'Ended'
  }
}
