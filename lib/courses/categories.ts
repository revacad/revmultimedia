export const COURSE_CATEGORIES = {
  design: {
    label: 'Design',
    description: 'Brand identity, packaging, editorial, visual storytelling, UI/UX',
    color: '#764ba2',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  video_motion: {
    label: 'Video & Motion',
    description: 'Video editing, film production, motion graphics',
    color: '#f5576c',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
  },
  technology: {
    label: 'Technology',
    description: 'Web development, AI tools, digital systems',
    color: '#00f2fe',
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
  },
  marketing: {
    label: 'Marketing',
    description: 'Social media marketing, digital marketing, content strategy',
    color: '#fa709a',
    gradient: 'linear-gradient(135deg, #fa709a, #fee140)',
  },
} as const

export type CourseCategory = keyof typeof COURSE_CATEGORIES

export const COURSE_CATEGORY_KEYS = Object.keys(
  COURSE_CATEGORIES,
) as CourseCategory[]

export function getCategoryLabel(category: string): string {
  return COURSE_CATEGORIES[category as CourseCategory]?.label ?? category
}

export function getCategoryGradient(category: string): string {
  return (
    COURSE_CATEGORIES[category as CourseCategory]?.gradient ??
    'linear-gradient(135deg, #667eea, #764ba2)'
  )
}

export function getCategoryColor(category: string): string {
  return COURSE_CATEGORIES[category as CourseCategory]?.color ?? '#764ba2'
}
