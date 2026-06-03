import type { Course } from '@/lib/courses/types'

export const GHOST_FILLERS = [
  {
    title: 'Graphic Design',
    accent: 'primary' as const,
    icon: 'pen' as const,
    imageSrc: '/images/color-scheme.jpg',
  },
  {
    title: 'Motion Graphics',
    accent: 'secondary' as const,
    icon: 'play' as const,
    imageSrc: '/images/digital-pen.jpg',
  },
  {
    title: 'Video Editing',
    accent: 'accent' as const,
    icon: 'cut' as const,
    imageSrc: '/images/timeline.jpg',
  },
]

export function buildFeaturedSlots(courses: Course[]) {
  const slots: Array<
    | { kind: 'course'; course: Course }
    | { kind: 'ghost'; ghost: (typeof GHOST_FILLERS)[number] }
  > = courses.slice(0, 3).map((course) => ({ kind: 'course' as const, course }))

  let ghostIndex = 0
  while (slots.length < 3 && ghostIndex < GHOST_FILLERS.length) {
    slots.push({ kind: 'ghost', ghost: GHOST_FILLERS[ghostIndex] })
    ghostIndex += 1
  }

  return slots
}

export type NextIntakePreview = {
  id: string
  name: string
  start_date: string
  courses: { title: string } | null
}
