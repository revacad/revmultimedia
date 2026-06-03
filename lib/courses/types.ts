import type { CourseCategory } from '@/lib/courses/categories'

export type { CourseCategory } from '@/lib/courses/categories'

export type CourseMode = 'online' | 'in_person' | 'hybrid'

export interface Intake {
  id: string
  course_id: string
  name: string
  start_date: string
  end_date: string
  application_deadline: string | null
  max_slots: number | null
  enrolled_count: number
  is_closed: boolean
}

export type CourseCurriculum = {
  html?: string
  version?: number
  outline?: string
  sections?: string[]
}

export interface Course {
  id: string
  title: string
  slug: string
  category: CourseCategory
  description: string | null
  curriculum: CourseCurriculum | null
  video_intro_url: string | null
  mode: CourseMode
  tuition_fee_ghs: number
  max_slots: number
  is_published: boolean
  thumbnail_r2_key: string | null
  /** Server-generated presigned URL (24h); prefer over /api/r2/document for thumbnails. */
  thumbnail_url?: string | null
  instructor_name: string | null
  instructor_title: string | null
  instructor_bio: string | null
  instructor_photo_r2_key: string | null
  /** Server-generated presigned URL (24h); prefer over /api/r2/document for instructor photos. */
  instructor_photo_url?: string | null
  duration_weeks?: number
  duration?: string | null
  created_at?: string
  updated_at?: string
  intakes: Intake[]
}

export const CATEGORY_FALLBACK_IMAGES: Record<CourseCategory, string> = {
  design: '/images/color-scheme.jpg',
  video_motion: '/images/timeline.jpg',
  technology: '/images/digital-pen.jpg',
  marketing: '/images/color-scheme.jpg',
}
