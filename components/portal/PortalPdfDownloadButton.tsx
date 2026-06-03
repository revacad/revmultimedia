'use client'

interface PortalPdfDownloadButtonProps {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

export default function PortalPdfDownloadButton({
  label,
  href,
  variant = 'secondary',
}: PortalPdfDownloadButtonProps) {
  const className =
    variant === 'primary'
      ? 'inline-flex rounded-full bg-primary px-4 py-2 font-body text-sm font-semibold text-white hover:opacity-90'
      : 'inline-flex rounded-full border border-[#D8D8E8] px-4 py-2 font-body text-sm font-semibold text-[#5A5A7A] hover:border-[#C74A86] hover:text-[#C74A86]'

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
    </a>
  )
}
