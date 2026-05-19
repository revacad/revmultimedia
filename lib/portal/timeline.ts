export const TIMELINE_STEPS = [
  'Submitted',
  'Under Review',
  'Shortlisted',
  'Accepted',
  'Payment',
  'Enrolled',
] as const

export function resolveTimelineActiveStep(
  status: string,
  options: { hasStudent: boolean; tuitionPaid: boolean },
): number {
  if (options.hasStudent) return 6
  if (options.tuitionPaid) return 5

  switch (status) {
    case 'pending':
      return 1
    case 'under_review':
      return 2
    case 'shortlisted':
      return 3
    case 'accepted':
      return 4
    case 'rejected':
      return 2
    case 'deferred':
      return 3
    default:
      return 1
  }
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName
}
