import AccountsWhatsAppNotifyLink from '@/components/portal/AccountsWhatsAppNotifyLink'
import CopyButton from '@/components/portal/CopyButton'
import { hasManualPaymentDetails } from '@/lib/portal/payment-details'
import { accountsWhatsAppWaMeUrl } from '@/lib/settings/accounts-whatsapp'
import { momoPaymentHeading } from '@/lib/settings/momo-provider'
import { WHATSAPP_SUPPORT_URL } from '@/lib/support/whatsapp'

interface PaymentInstructionsProps {
  settings: Record<string, string>
  invoiceReference: string
}

function InfoIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-[#C4701E]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

export default function PaymentInstructions({
  settings,
  invoiceReference,
}: PaymentInstructionsProps) {
  if (!hasManualPaymentDetails(settings)) {
    const accountsWaUrl = accountsWhatsAppWaMeUrl(settings.accounts_whatsapp_number)
    return (
      <div className="mt-4 rounded-lg border border-[#F5E6C8] bg-[#FFFBF0] p-4">
        <div className="flex gap-3">
          <InfoIcon />
          <div className="min-w-0 text-left">
            <p className="font-body text-sm leading-relaxed text-[#5A5A7A]">
              Payment details are not yet configured. Please contact us directly to arrange your
              payment.
            </p>
            {accountsWaUrl ? (
              <AccountsWhatsAppNotifyLink settings={settings} className="mt-3 inline-flex" />
            ) : (
              <a
                href={WHATSAPP_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex font-body text-sm font-semibold text-[#1E9990] hover:underline"
              >
                Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

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
            <p className="font-body text-sm font-semibold text-[#1A1A2E]">
              {momoPaymentHeading(settings)}
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
      <AccountsWhatsAppNotifyLink settings={settings} />
    </div>
  )
}
