import CopyButton from '@/components/portal/CopyButton'

interface PortalInvoicePaymentCardProps {
  settings: Record<string, string>
  invoiceReference: string
  showInternational?: boolean
}

export default function PortalInvoicePaymentCard({
  settings,
  invoiceReference,
  showInternational = false,
}: PortalInvoicePaymentCardProps) {
  return (
    <div className="mt-4 rounded-lg bg-[#F7F8FC] p-5">
      {settings.momo_number_1 && (
        <section className="mb-4">
          <h3 className="font-body text-sm font-semibold text-[#1A1A2E]">Pay via MoMo</h3>
          <p className="mt-2 font-body text-sm text-[#1A1A2E]">{settings.momo_number_1}</p>
          {settings.momo_name_1 && (
            <p className="font-body text-xs text-[#5A5A7A]">{settings.momo_name_1}</p>
          )}
          <p className="mt-2 font-body text-xs text-[#9898B8]">Reference to quote</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-[#C74A86]">{invoiceReference}</span>
            <CopyButton text={invoiceReference} />
          </div>
        </section>
      )}

      {settings.bank_account_number && (
        <section className="mb-4">
          <h3 className="font-body text-sm font-semibold text-[#1A1A2E]">Pay via Bank Transfer</h3>
          <p className="mt-2 font-body text-sm text-[#1A1A2E]">
            {settings.bank_name} · {settings.bank_account_number}
          </p>
          {settings.bank_account_name && (
            <p className="font-body text-xs text-[#5A5A7A]">{settings.bank_account_name}</p>
          )}
          <p className="mt-2 font-body text-xs text-[#9898B8]">Reference to quote</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-[#C74A86]">{invoiceReference}</span>
            <CopyButton text={invoiceReference} />
          </div>
        </section>
      )}

      {showInternational && settings.bank_swift_code && (
        <section>
          <h3 className="font-body text-sm font-semibold text-[#1A1A2E]">
            International Wire Transfer
          </h3>
          <p className="mt-2 font-body text-sm text-[#1A1A2E]">
            SWIFT/BIC: {settings.bank_swift_code}
          </p>
          {settings.bank_iban && (
            <p className="font-body text-xs text-[#5A5A7A]">IBAN: {settings.bank_iban}</p>
          )}
        </section>
      )}
    </div>
  )
}
