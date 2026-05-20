import type { CourseCurriculum } from '@/lib/courses/types'

export function curriculumHtml(curriculum: CourseCurriculum | null | undefined): string {
  if (!curriculum) return ''
  if (typeof curriculum.html === 'string' && curriculum.html.trim()) {
    return curriculum.html
  }
  if (typeof curriculum.outline === 'string' && curriculum.outline.trim()) {
    const paragraphs = curriculum.outline
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join('')
    return paragraphs
  }
  if (Array.isArray(curriculum.sections) && curriculum.sections.length > 0) {
    const items = curriculum.sections
      .map((s) => `<li>${escapeHtml(s)}</li>`)
      .join('')
    return `<ul>${items}</ul>`
  }
  return ''
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function isVideoIntroUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return true
  return (
    /(?:youtu\.be\/|youtube\.com\/watch\?v=)/i.test(trimmed) ||
    /vimeo\.com\/\d+/i.test(trimmed)
  )
}

export function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\s]+)/)
  return match?.[1] ?? null
}

export function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match?.[1] ?? null
}
