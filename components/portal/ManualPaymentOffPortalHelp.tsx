import AccountsWhatsAppNotifyLink from '@/components/portal/AccountsWhatsAppNotifyLink'

interface ManualPaymentOffPortalHelpProps {
  settings: Record<string, string>
}

/** Shown when Paystack is on — manual settlement happens outside the portal. */
export default function ManualPaymentOffPortalHelp({
  settings,
}: ManualPaymentOffPortalHelpProps) {
  return (
    <div className="mt-4 rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] p-4 text-left">
      <p className="font-body text-sm leading-relaxed text-[#5A5A7A]">
        If you cannot pay online, or you have already paid by MoMo or bank transfer, contact our
        accounts team. Manual payments are confirmed outside this system after you notify us.
      </p>
      <AccountsWhatsAppNotifyLink settings={settings} className="mt-3 inline-flex" />
    </div>
  )
}
