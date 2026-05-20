import CopyButton from '@/components/portal/CopyButton'

interface PaymentInstructionsProps {
  settings: Record<string, string>
  invoiceReference: string
}

export default function PaymentInstructions({
  settings,
  invoiceReference,
}: PaymentInstructionsProps) {
  return (
    <div className="mt-4 rounded-lg border border-[#EFEFF5] bg-[#F8F8FC] p-4">
      <p className="font-body text-sm font-semibold text-[#1A1A2E]">Payment instructions</p>
      <p className="mt-2 font-body text-sm text-[#5A5A7A]">
        Quote{' '}
        <span className="font-mono text-base font-semibold text-[#C74A86]">{invoiceReference}</span>{' '}
        as your payment reference.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-medium text-[#1A1A2E]">{invoiceReference}</span>
        <CopyButton text={invoiceReference} />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:space-y-3">
        {settings.momo_number_1 && (
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
              Mobile Money
            </p>
            <p className="font-body text-sm text-[#1A1A2E]">{settings.momo_number_1}</p>
            {settings.momo_name_1 && (
              <p className="font-body text-xs text-[#5A5A7A]">{settings.momo_name_1}</p>
            )}
          </div>
        )}
        {settings.bank_account_number && (
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
              Bank transfer
            </p>
            <p className="font-body text-sm text-[#1A1A2E]">
              {settings.bank_name} · {settings.bank_account_number}
            </p>
            {settings.bank_account_name && (
              <p className="font-body text-xs text-[#5A5A7A]">
                {settings.bank_account_name}
                {settings.bank_branch ? ` · ${settings.bank_branch}` : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
