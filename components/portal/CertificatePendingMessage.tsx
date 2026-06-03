import { WHATSAPP_SUPPORT_URL } from '@/lib/support/whatsapp'

export default function CertificatePendingMessage({ className }: { className?: string }) {
  return (
    <p className={className ?? 'font-body text-sm leading-relaxed text-[#5A5A7A]'}>
      Your certificate will be issued within 14 days of your course completion date. If your course
      has ended and you have not received it,{' '}
      <a
        href={WHATSAPP_SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[#C74A86] underline underline-offset-2 hover:text-[#A83A72]"
      >
        contact us on WhatsApp
      </a>
      .
    </p>
  )
}
