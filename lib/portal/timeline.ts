export const TIMELINE_STEPS = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Accepted',
  'Payment',
  'Enrolled',
] as const

export type TimelineStepKey = (typeof TIMELINE_STEPS)[number]

export const TIMELINE_STEP_DESCRIPTIONS: Record<TimelineStepKey, string> = {
  Applied: 'Your application has been received. We will begin reviewing it shortly.',
  'Under Review':
    'Our admissions team is reviewing your application. This typically takes 3 to 5 business days.',
  Shortlisted:
    'You have been shortlisted. We may contact you for additional information or an interview.',
  Accepted:
    'Congratulations, your application has been accepted. Proceed to pay your tuition to confirm your enrollment.',
  Payment: 'Pay your tuition fee to confirm your enrollment and secure your place.',
  Enrolled:
    'You are officially enrolled. Check your email for your enrollment letter and student ID.',
}

export const TIMELINE_STATUS_DESCRIPTIONS = {
  rejected:
    'Unfortunately your application was not successful this time. Contact us for feedback or to apply again.',
  waitlisted:
    'This intake is full. You are on the waitlist and will be notified when a spot becomes available.',
} as const

export function resolveTimelineActiveStep(
  status: string,
  options: {
    hasStudent?: boolean
    enrolledAt?: string | null
    hasTuitionInstallment?: boolean
    tuitionFullyPaid?: boolean
  },
): number {
  const enrolled = Boolean(options.hasStudent || options.enrolledAt)
  const paymentDone = Boolean(
    options.hasTuitionInstallment || options.tuitionFullyPaid,
  )

  if (enrolled) return 7
  if (paymentDone) return 6

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
    case 'waitlisted':
      return 1
    default:
      return 1
  }
}

export function timelineOptionsFromInvoices(
  application: { enrolled_at?: string | null },
  invoices: {
    type: string
    status: string
    installments?: { amount_ghs: number }[] | null
  }[],
  options?: { hasStudent?: boolean },
) {
  const tuitionInvoice = invoices.find((inv) => inv.type === 'tuition')
  const installments = tuitionInvoice?.installments ?? []

  return {
    hasStudent: options?.hasStudent ?? false,
    enrolledAt: application.enrolled_at,
    hasTuitionInstallment: installments.length > 0,
    tuitionFullyPaid: tuitionInvoice?.status === 'paid',
  }
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName
}
