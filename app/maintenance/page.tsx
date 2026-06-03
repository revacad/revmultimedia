import Image from 'next/image'
import Link from 'next/link'
import { getMaintenanceSettings } from '@/lib/maintenance/settings'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Maintenance — Rev Multimedia',
  robots: { index: false, follow: false },
}

export default async function MaintenancePage() {
  const settings = await getMaintenanceSettings()
  const deadline = settings.maintenance_deadline
    ? formatMaintenanceDeadline(settings.maintenance_deadline)
    : null

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <Image
        src="/images/apply-background.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[#1A1A2E]/82" aria-hidden />

      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center">
        <Image
          src="/icons/icon-512.png"
          alt="Rev Multimedia"
          width={72}
          height={72}
          className="rounded-2xl"
          priority
        />
        <p className="mt-4 font-display text-lg font-semibold tracking-wide text-white">
          Rev Multimedia
        </p>

        <h1 className="mt-10 font-display text-3xl font-bold text-white md:text-4xl">
          We&apos;ll be back soon
        </h1>

        {settings.maintenance_message ? (
          <p className="mt-5 font-body text-base leading-relaxed text-white/85">
            {settings.maintenance_message}
          </p>
        ) : (
          <p className="mt-5 font-body text-base leading-relaxed text-white/75">
            We are performing scheduled maintenance. Thank you for your patience.
          </p>
        )}

        {deadline && (
          <p className="mt-4 font-body text-sm font-medium text-white/90">
            Expected back: {deadline}
          </p>
        )}

        <Link
          href="https://wa.me/233204543372"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex rounded-full bg-[#e63946] px-6 py-3 font-body text-sm font-semibold text-white transition-colors hover:bg-[#d62839]"
        >
          Contact us on WhatsApp
        </Link>
      </div>
    </main>
  )
}

function formatMaintenanceDeadline(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Accra',
  })
}
