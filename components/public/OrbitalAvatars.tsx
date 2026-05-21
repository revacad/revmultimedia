'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface OrbitalRing {
  photos: string[]
  radius: number
  size: number
  duration: number
}

const rings: OrbitalRing[] = [
  {
    photos: ['pers1.jpg', 'pers2.jpg', 'pers3.jpg'],
    radius: 100,
    size: 56,
    duration: 20,
  },
  {
    photos: ['pers4.jpg', 'pers5.jpg', 'pers6.jpg', 'pers7.jpg'],
    radius: 165,
    size: 52,
    duration: 28,
  },
  {
    photos: ['pers8.jpg', 'pers9.jpg', 'pers10.jpg', 'pers11.jpg', 'pers12.jpg'],
    radius: 230,
    size: 48,
    duration: 36,
  },
  {
    photos: ['pers13.jpg', 'pers14.jpg', 'pers15.jpg'],
    radius: 295,
    size: 44,
    duration: 44,
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
          gsap.to(photo, {
            y: -8,
            duration: 1.8 + i * 0.15,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.12,
          })
        })

        rings.forEach((_, ringIndex) => {
          const ring = containerRef.current?.querySelector(`.orbital-ring-${ringIndex}`)
          if (!ring) return

          const direction = ringIndex % 2 === 0 ? 360 : -360
          gsap.to(ring, {
            rotation: direction,
            duration: rings[ringIndex].duration,
            repeat: -1,
            ease: 'none',
          })

          const ringPhotos = ring.querySelectorAll('.orbital-photo-wrapper')
          ringPhotos.forEach((photo) => {
            gsap.to(photo, {
              rotation: -direction,
              duration: rings[ringIndex].duration,
              repeat: -1,
              ease: 'none',
            })
          })
        })
      }, containerRef)
    }

    void loadGSAP()

    return () => {
      ctx?.revert()
    }
  }, [])

  const containerSize = 640
  const centre = containerSize / 2

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
          textAlign: 'center',
          zIndex: 10,
          background: 'radial-gradient(circle, rgba(199,74,134,0.08) 0%, transparent 70%)',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '52px',
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
            fontSize: '11px',
            color: '#9898B8',
            textAlign: 'center',
            marginTop: '6px',
            lineHeight: 1.4,
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
            top: centre,
            left: centre,
            width: ring.radius * 2,
            height: ring.radius * 2,
            marginTop: -ring.radius,
            marginLeft: -ring.radius,
            borderRadius: '50%',
            border: '1px dashed rgba(199,74,134,0.12)',
          }}
        >
          {ring.photos.map((photo, photoIndex) => {
            const angle = (photoIndex / ring.photos.length) * 360
            const rad = (angle * Math.PI) / 180
            const x = ring.radius + ring.radius * Math.cos(rad) - ring.size / 2
            const y = ring.radius + ring.radius * Math.sin(rad) - ring.size / 2

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
                    alt={`Alumni ${photoIndex + 1}`}
                    width={ring.size}
                    height={ring.size}
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                    }}
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
