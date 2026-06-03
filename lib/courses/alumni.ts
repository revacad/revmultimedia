export const COURSE_ALUMNI: Record<string, string[]> = {
  'graphic-design': ['pers1.jpg', 'pers2.jpg', 'pers3.jpg'],
  'brand-identity-design': ['pers4.jpg', 'pers5.jpg', 'pers6.jpg'],
  'video-editing': ['pers7.jpg', 'pers8.jpg', 'pers9.jpg'],
  'web-development-with-wordpress': ['pers10.jpg', 'pers11.jpg', 'pers12.jpg'],
  'social-media-marketing': ['pers13.jpg', 'pers14.jpg', 'pers15.jpg'],
  'ai-for-accounting': ['pers16.jpg', 'pers17.jpg', 'pers1.jpg'],
  'ui-ux-design': ['pers2.jpg', 'pers3.jpg', 'pers4.jpg'],
  'visual-storytelling': ['pers5.jpg', 'pers6.jpg', 'pers7.jpg'],
  'packaging-design': ['pers8.jpg', 'pers9.jpg', 'pers10.jpg'],
  'editorial-design': ['pers11.jpg', 'pers12.jpg', 'pers13.jpg'],
}

export const DEFAULT_ALUMNI = ['pers14.jpg', 'pers15.jpg', 'pers16.jpg']

export const COURSE_STUDENT_COUNTS: Record<string, number> = {
  'graphic-design': 148,
  'brand-identity-design': 96,
  'video-editing': 112,
  'web-development-with-wordpress': 67,
  'social-media-marketing': 84,
  'ai-for-accounting': 43,
  'ui-ux-design': 79,
  'visual-storytelling': 56,
  'packaging-design': 38,
  'editorial-design': 29,
}

export function getCourseAlumni(slug: string): string[] {
  return COURSE_ALUMNI[slug] ?? DEFAULT_ALUMNI
}

export function getCourseStudentCount(slug: string): number {
  return COURSE_STUDENT_COUNTS[slug] ?? 24
}
