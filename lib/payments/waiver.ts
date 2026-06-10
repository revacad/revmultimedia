export const WAIVER_REASONS = [
  'Scholarship',
  'Financial hardship',
  'Staff or family discount',
  'Management decision',
  'Partner or sponsor coverage',
  'Other',
] as const

export type WaiverReason = (typeof WAIVER_REASONS)[number]
