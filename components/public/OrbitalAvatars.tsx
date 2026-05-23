'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface OrbitalRing {
  photos: string[]
  radius: number
  size: number
  startAngle: number
}

const rings: OrbitalRing[] = [
  {
    photos: ['pers1.jpg', 'pers2.jpg', 'pers3.jpg', 'pers4.jpg', 'pers5.jpg'],
    radius: 110,
    size: 54,
    startAngle: 0,
  },
  {
    photos: ['pers6.jpg', 'pers7.jpg', 'pers8.jpg', 'pers9.jpg', 'pers10.jpg', 'pers11.jpg'],
    radius: 185,
    size: 48,
    startAngle: 30,
  },
  {
    photos: [
      'pers12.jpg',
      'pers13.jpg',
      'pers14.jpg',
      'pers15.jpg',
      'pers16.jpg',
      'pers17.jpg',
    ],
    radius: 255,
    size: 44,
    startAngle: 45,
  },
]

export function OrbitalAvatars() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ctx: { revert: () => void } | undefined

    const loadGSAP = async () => {
      const { gsap } = await import('gsap')

      ctx = gsap.context(() => {
        const photos = containerRef.current?.querySelectorAll('.orbital-photo')
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
          width: '130px',
          height: '130px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(199,74,134,0.18)',
          border: '2px solid rgba(199,74,134,0.15)',
        }}
      >
        <span
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '36px',
            fontWeight: 700,
            color: '#C74A86',
            lineHeight: 1,
          }}
        >
          100+
        </span>
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '10px',
            color: '#9898B8',
            marginTop: '4px',
            lineHeight: 1.4,
            textAlign: 'center',
          }}
        >
          Alumni
          <br />
          99% Grad Rate
        </span>
      </div>

      {rings.map((ring, ringIndex) => (
        <div
          key={ringIndex}
          className={`orbital-ring-${ringIndex}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: ring.radius * 2,
            height: ring.radius * 2,
            marginTop: -ring.radius,
            marginLeft: -ring.radius,
            borderRadius: '50%',
            border: '1.5px solid rgba(199,74,134,0.25)',
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
                className="orbital-photo-wrapper"
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: ring.size,
                  height: ring.size,
                }}
              >
                <div
                  className="orbital-photo"
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
                    src={`/alumni/${photo}`}
                    alt="Rev Multimedia alumni trained in Accra Ghana"
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
