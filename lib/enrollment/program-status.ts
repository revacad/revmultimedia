import { roundGhs } from '@/lib/payments/balance'

export type ProgramLifecycleStatus =
  | 'registered'
  | 'tuition_paid'
  | 'enrolled'
  | 'fully_paid'

export type ProgramStatusInput = {
  registeredAt: string
  enrolledAt: string | null
  tuitionPaidGhs: number
  tuitionInvoiceStatus: string | null
  hasStudentRecord: boolean
}

export function sumTuitionPaidFromInvoices(
  invoices:
    | {
        type: string
        status: string
        installments?: { amount_ghs: number }[] | null
      }[]
    | null
    | undefined,
): { tuitionPaidGhs: number; tuitionInvoiceStatus: string | null } {
  const tuition = (invoices ?? []).find((inv) => inv.type === 'tuition')
  if (!tuition) {
    return { tuitionPaidGhs: 0, tuitionInvoiceStatus: null }
  }

  const paid = roundGhs(
    (tuition.installments ?? []).reduce(
      (sum, row) => sum + Number(row.amount_ghs),
      0,
    ),
  )

  return {
    tuitionPaidGhs: paid,
    tuitionInvoiceStatus: tuition.status,
  }
}

export function hasTuitionPayment(
  tuitionPaidGhs: number,
  tuitionInvoiceStatus: string | null,
): boolean {
  return tuitionPaidGhs > 0 || tuitionInvoiceStatus === 'paid'
}

export function deriveProgramLifecycleStatus(
  input: ProgramStatusInput,
): ProgramLifecycleStatus {
  if (input.enrolledAt) {
    if (input.hasStudentRecord || input.tuitionInvoiceStatus === 'paid') {
      return 'fully_paid'
    }
    return 'enrolled'
  }

  if (hasTuitionPayment(input.tuitionPaidGhs, input.tuitionInvoiceStatus)) {
    return 'tuition_paid'
  }

  return 'registered'
}

export const PROGRAM_STATUS_LABELS: Record<ProgramLifecycleStatus, string> = {
  registered: 'Registered',
  tuition_paid: 'Tuition paid',
  enrolled: 'Enrolled',
  fully_paid: 'Fully paid',
}
