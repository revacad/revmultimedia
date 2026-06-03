import Link from 'next/link'

export default function CtaSection() {
  return (
    <section
      className="reveal-section"
      style={{
        background: 'linear-gradient(135deg, #1A1A2E 0%, #2F2F52 100%)',
        padding: '80px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(199,74,134,0.15) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <h2
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '48px',
            fontWeight: 700,
            color: 'white',
            marginBottom: '16px',
            lineHeight: 1.15,
          }}
        >
          Your creative career starts
          <br />
          with one decision.
        </h2>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            color: 'rgba(255,255,255,0.65)',
            marginBottom: '40px',
            maxWidth: '520px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}
        >
          Applications are open for our upcoming cohorts. Spots are limited: we keep class
          sizes small intentionally, so every student gets the attention they deserve.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '40px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '9999px',
              padding: '10px 24px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            Application fee: GHS 100 per application
          </div>
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '9999px',
              padding: '10px 24px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            Career-focused · Skills that last
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/apply"
            style={{
              backgroundColor: 'white',
              color: '#1A1A2E',
              padding: '16px 40px',
              borderRadius: '9999px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-block',
              boxShadow: '0 4px 24px rgba(0,0,0,0.20)',
            }}
          >
            Apply Now, Join the Next Cohort
          </Link>
          <Link
            href="/courses"
            style={{
              backgroundColor: 'transparent',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '9999px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              border: '1.5px solid rgba(255,255,255,0.30)',
            }}
          >
            View our courses
          </Link>
        </div>
      </div>
    </section>
  )
}
