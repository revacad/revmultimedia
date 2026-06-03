'use client'

import { useRef, useState } from 'react'
import CtaSection from '@/components/public/home/CtaSection'
import CoursesSection from '@/components/public/home/CoursesSection'
import HeroSection from '@/components/public/home/HeroSection'
import PromoTermsModal from '@/components/public/home/PromoTermsModal'
import StatsSection from '@/components/public/home/StatsSection'
import TestimonialsSection from '@/components/public/home/TestimonialsSection'
import WhyRevSection from '@/components/public/home/WhyRevSection'
import { useHomeGsap } from '@/components/public/home/useHomeGsap'
import type { NextIntakePreview } from '@/lib/home/featured-slots'
import type { Course } from '@/lib/courses/types'

export type { NextIntakePreview }

interface HomePageClientProps {
  courses: Course[]
  nextIntake?: NextIntakePreview | null
}

export default function HomePageClient({ courses, nextIntake }: HomePageClientProps) {
  const heroLeftRef = useRef<HTMLDivElement>(null)
  const heroCardRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLElement>(null)
  const [promoTermsOpen, setPromoTermsOpen] = useState(false)

  useHomeGsap(heroLeftRef, heroCardRef, statsRef)

  return (
    <div>
      <HeroSection
        nextIntake={nextIntake}
        heroLeftRef={heroLeftRef}
        heroCardRef={heroCardRef}
        onOpenPromoTerms={() => setPromoTermsOpen(true)}
      />

      <PromoTermsModal open={promoTermsOpen} onClose={() => setPromoTermsOpen(false)} />

      <StatsSection statsRef={statsRef} />
      <CoursesSection courses={courses} />
      <WhyRevSection />
      <TestimonialsSection />
      <CtaSection />
    </div>
  )
}
