import { accountsWhatsAppWaMeUrl } from '@/lib/settings/accounts-whatsapp'

interface AccountsWhatsAppNotifyLinkProps {
  settings: Record<string, string>
  className?: string
}

export default function AccountsWhatsAppNotifyLink({
  settings,
  className = 'mt-4 inline-flex font-body text-sm font-semibold text-[#1E9990] hover:underline',
}: AccountsWhatsAppNotifyLinkProps) {
  const url = accountsWhatsAppWaMeUrl(settings.accounts_whatsapp_number)
  if (!url) return null

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      Chat with Accounts on WhatsApp
    </a>
  )
}
