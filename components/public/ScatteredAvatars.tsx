'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const AVATARS = [
  { id: 1, top: '10%', left: '20%', size: 64 },
  { id: 2, top: '5%', left: '60%', size: 48 },
  { id: 3, top: '35%', left: '5%', size: 56 },
  { id: 4, top: '30%', left: '75%', size: 52 },
  { id: 5, top: '60%', left: '15%', size: 60 },
  { id: 6, top: '65%', left: '55%', size: 44 },
  { id: 7, top: '80%', left: '35%', size: 56 },
] as const

const DOTS = [
  { top: '22%', left: '45%' },
  { top: '48%', left: '38%' },
  { top: '55%', left: '68%' },
  { top: '72%', left: '28%' },
  { top: '18%', left: '72%' },
]

interface ScatteredAvatarsProps {
  featuredLabel?: string
  featuredName?: string
  className?: string
}

export default function ScatteredAvatars({
  featuredLabel = 'Featured Student',
  featuredName = '50+ Trained',
  className,
}: ScatteredAvatarsProps) {
  useEffect(() => {
    let tweens: Array<{ kill: () => void }> = []

    const loadGSAP = async () => {
      const { gsap } = await import('gsap')
      const avatars = document.querySelectorAll('.avatar-float')
      avatars.forEach((avatar, i) => {
        const tween = gsap.to(avatar, {
          y: -12,
          duration: 2.5 + i * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.2,
        })
        tweens.push(tween)
      })
    }

    void loadGSAP()

    return () => {
      tweens.forEach((t) => t.kill())
      tweens = []
    }
  }, [])

  return (
    <div
      className={cn(
        'relative mx-auto h-[280px] w-full max-w-[280px] md:h-[400px] md:max-w-[400px]',
        '[&_.avatar-float]:max-md:origin-center [&_.avatar-float]:max-md:scale-[0.7]',
        className,
      )}
    >
      {AVATARS.map((a) => (
        <div
          key={a.id}
          className="avatar-float absolute overflow-hidden rounded-full border-[3px] border-white shadow-md"
          style={{
            top: a.top,
            left: a.left,
            width: a.size,
            height: a.size,
          }}
        >
          <Image
            src={`/members/person${a.id}.webp`}
            alt={`Community member ${a.id}`}
            width={a.size}
            height={a.size}
            sizes={`${a.size}px`}
            className="h-full w-full object-cover"
          />
        </div>
      ))}

      {DOTS.map((d, i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-primary/30"
          style={{ top: d.top, left: d.left }}
        />
      ))}

      <div
        className="absolute flex items-center gap-3 rounded-full px-5 py-3 shadow-glow-primary"
        style={{
          top: '45%',
          left: '40%',
          background: 'linear-gradient(135deg, #C74A86, #F18F3B)',
        }}
      >
        <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-white">
          <Image
            src="/members/person4.webp"
            alt="Featured student"
            width={36}
            height={36}
            sizes="36px"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase text-white/70">{featuredLabel}</p>
          <p className="text-sm font-semibold text-white">{featuredName}</p>
        </div>
      </div>
    </div>
  )
}
