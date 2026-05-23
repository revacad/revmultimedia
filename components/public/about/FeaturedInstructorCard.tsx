import Image from 'next/image'

export function FeaturedInstructorCard() {
  return (
    <a href="/apply" style={{ textDecoration: 'none' }}>
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#2DBFB8',
            borderRadius: '9999px',
            padding: '12px 24px 12px 56px',
            display: 'flex',
            flexDirection: 'column',
            minWidth: '160px',
            boxShadow: '0 8px 32px rgba(45,191,184,0.30)',
          }}
        >
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.75)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Ready to start?
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontFamily: 'Clash Display, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                color: 'white',
              }}
            >
              Join Now
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: '-4px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid white',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 2,
            flexShrink: 0,
          }}
        >
          <Image
            src="/members/founder.jpg"
            alt="Godfred Ferdinand Appiah, Lead Instructor at Rev Multimedia"
            width={52}
            height={52}
            sizes="52px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>
    </a>
  )
}
