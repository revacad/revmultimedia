import type { Metadata } from 'next'
import PublicLayoutShell from '@/components/public/PublicLayoutShell'

function metadataBaseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (raw) {
    try {
      const url = new URL(raw)
      if (url.hostname) return url
    } catch {
      // ignore invalid env value
    }
  }
  return new URL('https://revmultimedia.com')
}

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: {
    default: 'Rev Multimedia | Creative Education in Ghana',
    template: '%s | Rev Multimedia',
  },
  description:
    'Rev Multimedia trains the next generation of Ghanaian and African creatives in Graphic Design, Motion Graphics, and Video Editing.',
  keywords: [
    'graphic design ghana',
    'motion graphics ghana',
    'video editing course accra',
    'creative academy ghana',
    'rev multimedia',
  ],
  authors: [{ name: 'Rev Multimedia' }],
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://revmultimediagh.com',
    siteName: 'Rev Multimedia',
    title: 'Rev Multimedia | Creative Education in Ghana',
    description:
      'Professional training in Graphic Design, Motion Graphics, and Video Editing. Based in Accra, Ghana.',
    images: [
      {
        url: '/images/african-creatives-in-class.jpg',
        width: 1200,
        height: 630,
        alt: 'Rev Multimedia students',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rev Multimedia',
    description:
      'Creative education for the AI era. Graphic Design, Motion Graphics, Video Editing.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RevMultimedia',
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PublicLayoutShell>{children}</PublicLayoutShell>
}
