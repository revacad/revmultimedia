import type { CourseCurriculum } from '@/lib/courses/types'

export type ProcessedCurriculum = {
  html: string
  toc: string[]
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeCurriculum(curriculum: unknown): CourseCurriculum | null {
  if (!curriculum) return null
  if (typeof curriculum === 'string') {
    const trimmed = curriculum.trim()
    if (!trimmed) return null
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (parsed && typeof parsed === 'object') {
        return parsed as CourseCurriculum
      }
    } catch {
      // not JSON
    }
    if (trimmed.includes('<')) {
      return { html: trimmed, version: 1 }
    }
    return { outline: trimmed }
  }
  if (typeof curriculum === 'object') {
    return curriculum as CourseCurriculum
  }
  return null
}

function injectHeadingIds(html: string): ProcessedCurriculum {
  const toc: string[] = []
  let sectionIndex = 0
  const processed = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, level: string, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, '').trim()
      if (!text) return match
      if (toc.length < 12) toc.push(text)
      const id = `section-${sectionIndex++}`
      const attrsWithoutId = attrs.replace(/\s*id="[^"]*"/gi, '')
      return `<h${level} id="${id}"${attrsWithoutId}>${inner}</h${level}>`
    },
  )
  return { html: processed, toc }
}

function plainTextToHtml(text: string): ProcessedCurriculum {
  const toc: string[] = []
  const lines = text.split('\n')
  let html = ''
  let inList = false

  const closeList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      closeList()
      html += '<br />'
      continue
    }

    if (
      trimmed.match(/^MODULE\s+\d+/i) ||
      (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /[A-Z]/.test(trimmed))
    ) {
      closeList()
      toc.push(trimmed)
      const sectionId = toc.length - 1
      html += `<h2 id="section-${sectionId}">${escapeHtml(trimmed)}</h2>`
      continue
    }

    if (trimmed.match(/^\d+\.\d+/)) {
      closeList()
      html += `<h3>${escapeHtml(trimmed)}</h3>`
      continue
    }

    if (trimmed.match(/^\d+\.\s/)) {
      closeList()
      html += `<p>${escapeHtml(trimmed)}</p>`
      continue
    }

    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      if (!inList) {
        html += '<ul>'
        inList = true
      }
      html += `<li>${escapeHtml(trimmed.slice(1).trim())}</li>`
      continue
    }

    if (trimmed.endsWith(':') && trimmed.length < 40) {
      closeList()
      html += `<p><strong>${escapeHtml(trimmed)}</strong></p>`
      continue
    }

    closeList()
    html += `<p>${escapeHtml(trimmed)}</p>`
  }

  closeList()
  return { html, toc: toc.slice(0, 12) }
}

export function processCurriculum(curriculum: unknown): ProcessedCurriculum {
  const normalized = normalizeCurriculum(curriculum)
  if (!normalized) return { html: '', toc: [] }

  if (typeof normalized.html === 'string' && normalized.html.trim()) {
    return injectHeadingIds(normalized.html.trim())
  }

  if (typeof normalized.outline === 'string' && normalized.outline.trim()) {
    return plainTextToHtml(normalized.outline)
  }

  if (Array.isArray(normalized.sections) && normalized.sections.length > 0) {
    const toc = normalized.sections.map((s) => String(s).trim()).filter(Boolean).slice(0, 12)
    const html = toc
      .map((s, i) => `<h2 id="section-${i}">${escapeHtml(s)}</h2>`)
      .join('')
    return { html, toc }
  }

  return { html: '', toc: [] }
}

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
  return processCurriculum(curriculum).html
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
