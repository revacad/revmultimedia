import type { Intake } from '@/lib/courses/types'
import {
  intakeSlotsRemaining,
  isIntakeFull,
} from '@/lib/apply/intake-availability'
import { filterPublicOpenIntakes } from '@/lib/intakes/lifecycle'

export interface SlotIndicator {
  text: string
  colorClass: string
  dotClass: string
}

export function formatIntakeShortLabel(intake: Intake): string {
  const d = new Date(`${intake.start_date}T12:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function openIntakesSorted(intakes: Intake[]): Intake[] {
  return filterPublicOpenIntakes(intakes).sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  )
}

function indicatorForRemaining(
  remaining: number,
  text: string,
): SlotIndicator {
  if (remaining === 1) {
    return {
      text,
      colorClass: 'text-red-500',
      dotClass: 'bg-red-500',
    }
  }
  if (remaining <= 5) {
    return {
      text,
      colorClass: 'text-secondary',
      dotClass: 'bg-secondary',
    }
  }
  return {
    text,
    colorClass: 'text-accent',
    dotClass: 'bg-accent',
  }
}

/** @deprecated Use getSlotIndicator — sums across intakes */
export function getSlotsRemaining(intakes: Intake[]): number {
  if (intakes.length === 0) {
    return 0
  }

  return intakes.reduce((sum, intake) => {
    const max = intake.max_slots ?? 20
    return sum + Math.max(0, max - intake.enrolled_count)
  }, 0)
}

export function getSlotIndicator(intakes: Intake[]): SlotIndicator {
  const open = openIntakesSorted(intakes)

  if (open.length === 0) {
    return {
      text: 'No open intakes available',
      colorClass: 'text-gray-400',
      dotClass: 'bg-gray-400',
    }
  }

  const next = open[0]
  const nextLabel = formatIntakeShortLabel(next)
  const remaining = intakeSlotsRemaining(next)

  if (remaining === null) {
    return {
      text: next.name,
      colorClass: 'text-accent',
      dotClass: 'bg-accent',
    }
  }

  if (remaining > 0) {
    const text = `${nextLabel} - ${remaining} spot${remaining === 1 ? '' : 's'} left`
    return indicatorForRemaining(remaining, text)
  }

  const nextAvailable = open.find((i) => !isIntakeFull(i))
  if (nextAvailable) {
    const rem = intakeSlotsRemaining(nextAvailable)!
    const text = `${nextLabel} is full. Next: ${formatIntakeShortLabel(nextAvailable)} - ${rem} spot${rem === 1 ? '' : 's'} left`
    return indicatorForRemaining(rem, text)
  }

  return {
    text: 'All intakes full - join the waitlist',
    colorClass: 'text-gray-500',
    dotClass: 'bg-gray-400',
  }
}
