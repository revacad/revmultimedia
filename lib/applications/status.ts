import type { ApplicationStatus } from '@/lib/applications/types'

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  deferred: 'Deferred',
}

export const STATUS_BADGE_CLASS: Record<ApplicationStatus, string> = {
  pending: 'bg-[#F0F0F8] text-[#9898B8]',
  under_review: 'bg-[#EBF0FD] text-[#4A7BE8]',
  shortlisted: 'bg-[#FEF6EE] text-[#C4701E]',
  accepted: 'bg-[#EBF9F8] text-[#1E9990]',
  rejected: 'bg-[#FDECEC] text-[#E84A4A]',
  deferred: 'bg-[#FDF0F6] text-[#C74A86]',
}

export const FILTER_STATUSES: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'deferred', label: 'Deferred' },
]
