function fallbackCopy(text: string): boolean {
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.top = '0'
    el.style.left = '0'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.focus()
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

/** Copy text to the clipboard; resolves true on success. */
export function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false)
  }

  const value = text.trim()
  if (!value) {
    return Promise.resolve(false)
  }

  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value).then(
      () => true,
      () => Promise.resolve(fallbackCopy(value)),
    )
  }

  return Promise.resolve(fallbackCopy(value))
}
