'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface AboutOrbitalRing {
  photos: string[]
  radius: number
  size: number
  startAngle: number
}

const rings: AboutOrbitalRing[] = [
  {
    photos: ['pers1.jpg', 'person1.webp', 'pers2.jpg', 'person2.webp', 'pers3.jpg'],
    radius: 110,
    size: 54,
    startAngle: 0,
  },
  {
    photos: [
      'pers4.jpg',
      'person3.webp',
      'pers5.jpg',
      'person4.webp',
      'pers6.jpg',
      'person5.webp',
    ],
    radius: 185,
    size: 48,
    startAngle: 30,
  },
  {
    photos: ['pers7.jpg', 'person6.webp', 'pers8.jpg', 'pers9.jpg', 'pers10.jpg'],
    radius: 255,
    size: 44,
    startAngle: 45,
  },
]

function photoSrc(photo: string): string {
  if (photo.endsWith('.webp')) {
    return `/members/${photo}`
  }
  return `/alumni/${photo}`
}

export function AboutOrbitalAvatars() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ctx: { revert: () => void } | undefined

    const loadGSAP = async () => {
      const { gsap } = await import('gsap')

      ctx = gsap.context(() => {
        const photos = containerRef.current?.querySelectorAll('.about-orbital-photo')
        photos?.forEach((photo, i) => {
          if (i % 3 !== 0) return

          gsap.to(photo, {
            y: -10,
            duration: 2 + i * 0.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.3,
          })
        })
      }, containerRef)
    }

    void loadGSAP()

    return () => {
      ctx?.revert()
    }
  }, [])

  const containerSize = 560

  return (
    <div
      ref={containerRef}
      style={{
        width: containerSize,
        height: containerSize,
        position: 'relative',
        flexShrink: 0,
      }}
      aria-hidden
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(199,74,134,0.04) 0%, rgba(199,74,134,0.01) 60%, transparent 80%)',
          pointerEvents: 'none',
        }}
      />

      <a href="/apply" style={{ textDecoration: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10,
            backgroundColor: 'white',
            borderRadius: '50%',
            width: '100px',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(26,26,46,0.12)',
            border: '2px solid rgba(199,74,134,0.15)',
            cursor: 'pointer',
            gap: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              width: '24px',
              height: '24px',
              gap: '4px',
            }}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#C74A86' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F18F3B' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2DBFB8' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#C74A86', opacity: 0.6 }} />
          </div>
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '10px',
              fontWeight: 600,
              color: '#C74A86',
            }}
          >
            Apply Now
          </span>
        </div>
      </a>

      {rings.map((ring, ringIndex) => (
        <div
          key={ringIndex}
          className={`about-orbital-ring-${ringIndex}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: ring.radius * 2,
            height: ring.radius * 2,
            marginTop: -ring.radius,
            marginLeft: -ring.radius,
            borderRadius: '50%',
            border: '1.5px solid rgba(199,74,134,0.20)',
          }}
        >
          {ring.photos.map((photo, photoIndex) => {
            const angle =
              (ring.startAngle || 0) + (photoIndex / ring.photos.length) * 360
            const rad = (angle * Math.PI) / 180
            const x = Math.round(ring.radius + ring.radius * Math.cos(rad) - ring.size / 2)
            const y = Math.round(ring.radius + ring.radius * Math.sin(rad) - ring.size / 2)

            return (
              <div
                key={photo}
                className="about-orbital-photo-wrapper"
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: ring.size,
                  height: ring.size,
                }}
              >
                <div
                  className="about-orbital-photo"
                  style={{
                    width: ring.size,
                    height: ring.size,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid white',
                    boxShadow: '0 4px 16px rgba(26,26,46,0.15)',
                  }}
                >
                  <Image
                    src={photoSrc(photo)}
                    alt="Alumni"
                    width={ring.size}
                    height={ring.size}
                    sizes={`${ring.size}px`}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    className="object-cover"
                  />
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
