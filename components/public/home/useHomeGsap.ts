'use client'

import { useEffect, type RefObject } from 'react'

const GSAP_SAFETY_MS = 1000

function forceReveal(
  heroLeftRef: RefObject<HTMLDivElement | null>,
  heroCardRef: RefObject<HTMLDivElement | null>,
  statsRef: RefObject<HTMLElement | null>,
) {
  if (heroLeftRef.current) {
    Array.from(heroLeftRef.current.children).forEach((el) => {
      const node = el as HTMLElement
      node.style.opacity = '1'
      node.style.transform = 'none'
    })
  }

  if (heroCardRef.current) {
    heroCardRef.current.style.opacity = '1'
    heroCardRef.current.style.transform = 'none'
  }

  if (statsRef.current) {
    statsRef.current.querySelectorAll('.stat-item').forEach((el) => {
      const node = el as HTMLElement
      node.style.opacity = '1'
      node.style.transform = 'none'
    })
  }

  document.querySelectorAll('.reveal-section').forEach((el) => {
    const node = el as HTMLElement
    node.style.opacity = '1'
    node.style.transform = 'none'
  })
}

export function useHomeGsap(
  heroLeftRef: RefObject<HTMLDivElement | null>,
  heroCardRef: RefObject<HTMLDivElement | null>,
  statsRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    let ctx: { revert: () => void } | undefined
    let gsapStarted = false
    let revealedBySafety = false
    let cancelled = false

    const safetyTimer = window.setTimeout(() => {
      if (!gsapStarted && !cancelled) {
        revealedBySafety = true
        forceReveal(heroLeftRef, heroCardRef, statsRef)
      }
    }, GSAP_SAFETY_MS)

    const loadGSAP = async () => {
      try {
        const { gsap } = await import('gsap')
        const { ScrollTrigger } = await import('gsap/ScrollTrigger')
        if (cancelled || revealedBySafety) return

        gsap.registerPlugin(ScrollTrigger)
        gsapStarted = true
        window.clearTimeout(safetyTimer)

        ctx = gsap.context(() => {
          if (heroLeftRef.current) {
            gsap.set(heroLeftRef.current.children, { y: 30, opacity: 0 })
            gsap.to(heroLeftRef.current.children, {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.1,
              ease: 'power3.out',
            })
          }

          if (heroCardRef.current) {
            gsap.set(heroCardRef.current, { scale: 0.95, opacity: 0 })
            gsap.to(heroCardRef.current, {
              scale: 1,
              opacity: 1,
              duration: 0.8,
              delay: 0.3,
              ease: 'power3.out',
            })
            gsap.to(heroCardRef.current.querySelectorAll('.float-card'), {
              y: -8,
              duration: 2.5,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              stagger: 0.2,
            })
          }

          gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((section) => {
            gsap.from(section, {
              scrollTrigger: { trigger: section, start: 'top 85%' },
              y: 40,
              opacity: 0,
              duration: 0.7,
              ease: 'power3.out',
            })
          })

          if (statsRef.current) {
            gsap.from(statsRef.current.querySelectorAll('.stat-item'), {
              scrollTrigger: { trigger: statsRef.current, start: 'top 80%' },
              y: 24,
              opacity: 0,
              stagger: 0.1,
              duration: 0.6,
            })
          }
        })
      } catch {
        if (!cancelled) {
          forceReveal(heroLeftRef, heroCardRef, statsRef)
        }
        window.clearTimeout(safetyTimer)
      }
    }

    void loadGSAP()

    return () => {
      cancelled = true
      window.clearTimeout(safetyTimer)
      ctx?.revert()
      void import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.getAll().forEach((t) => t.kill())
      })
    }
  }, [heroLeftRef, heroCardRef, statsRef])
}
