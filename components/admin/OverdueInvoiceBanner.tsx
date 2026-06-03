const OVERDUE_WHATSAPP_URL = 'https://wa.me/233275818525'

function WarningIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-[#C4701E]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
      />
    </svg>
  )
}

interface OverdueInvoiceBannerProps {
  contactLabel?: string
  className?: string
}

export default function OverdueInvoiceBanner({
  contactLabel = 'Contact us',
  className,
}: OverdueInvoiceBannerProps) {
  return (
    <div
      className={
        className ??
        'flex gap-3 rounded-lg border border-[#F5D0A8] bg-[#FFF4E6] px-4 py-3'
      }
    >
      <WarningIcon />
      <div className="min-w-0">
        <p className="font-body text-sm font-medium text-[#1A1A2E]">
          This invoice is overdue. Please settle your balance to avoid losing your spot.
        </p>
        <a
          href={OVERDUE_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex font-body text-sm font-semibold text-[#1E9990] hover:underline"
        >
          {contactLabel}
        </a>
      </div>
    </div>
  )
}
