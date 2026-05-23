import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LocalBusinessJsonLd } from '@/components/seo/JsonLd'
import { PageTransitionLoader } from '@/components/ui/PageTransitionLoader'
import { siteDescription, siteKeywords, siteUrl } from '@/lib/seo'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Rev Multimedia | Creative Design School in Accra, Ghana',
    template: '%s | Rev Multimedia',
  },
  description: siteDescription,
  keywords: siteKeywords,
  authors: [{ name: 'Rev Multimedia', url: siteUrl }],
  creator: 'Rev Multimedia',
  publisher: 'Rev Multimedia',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: siteUrl,
    siteName: 'Rev Multimedia',
    title: 'Rev Multimedia | Creative Design School in Accra, Ghana',
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/images/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: 'Rev Multimedia, Creative Design School in Accra Ghana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@revmultimedia',
    creator: '@revmultimedia',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <LocalBusinessJsonLd />
        <meta name="author" content="Rev Multimedia" />
        <meta name="publisher" content="Rev Multimedia" />
        <meta name="copyright" content="Rev Multimedia" />
        <meta name="language" content="English" />
        <meta name="geo.region" content="GH-AA" />
        <meta name="geo.placename" content="Accra, Ghana" />
        <meta name="geo.position" content="5.5913;-0.3417" />
        <meta name="ICBM" content="5.5913, -0.3417" />
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RevMultimedia" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <Suspense fallback={null}>
          <PageTransitionLoader />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
