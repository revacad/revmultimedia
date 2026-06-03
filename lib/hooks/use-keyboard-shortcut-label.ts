'use client'

import { useEffect, useState } from 'react'

const DEFAULT_LABEL = 'Ctrl+K'

export function useKeyboardShortcutLabel(): string {
  const [shortcutLabel, setShortcutLabel] = useState(DEFAULT_LABEL)

  useEffect(() => {
    const isMac =
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
    setShortcutLabel(isMac ? '⌘K' : 'Ctrl+K')
  }, [])

  return shortcutLabel
}
