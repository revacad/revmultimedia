import type { Metadata } from 'next'
import Link from 'next/link'
import { PageContainer } from '@/components/ui/PageContainer'

export const metadata: Metadata = {
  title: 'Page Not Found | Rev Multimedia',
  description:
    'The page you requested could not be found on Rev Multimedia. Browse our creative design courses in Accra, Ghana, or return to the homepage.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <PageContainer>
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '48px 24px',
        }}
      >
        <div
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '120px',
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #C74A86, #F18F3B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </div>

        <h1
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '28px',
            color: '#1A1A2E',
            marginBottom: '12px',
          }}
        >
          This page went off-script.
        </h1>

        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            color: '#5A5A7A',
            maxWidth: '400px',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          The page you are looking for does not exist or has been moved. Let us get you back on
          track.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-block',
              backgroundColor: '#C74A86',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '9999px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Go to Home
          </Link>
          <Link
            href="/courses"
            style={{
              display: 'inline-block',
              backgroundColor: 'transparent',
              color: '#C74A86',
              border: '2px solid #C74A86',
              padding: '12px 24px',
              borderRadius: '9999px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            View Courses
          </Link>
          <Link
            href="/contact"
            style={{
              display: 'inline-block',
              backgroundColor: 'transparent',
              color: '#5A5A7A',
              border: '2px solid #EFEFF5',
              padding: '12px 24px',
              borderRadius: '9999px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Contact Us
          </Link>
        </div>

        <div
          style={{
            marginTop: '48px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <div
            style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C74A86' }}
          />
          <div
            style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F18F3B' }}
          />
          <div
            style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2DBFB8' }}
          />
        </div>
      </div>
    </PageContainer>
  )
}
