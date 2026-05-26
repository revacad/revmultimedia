'use client'

import { useEffect, useState } from 'react'
import { LogoLoader } from '@/components/ui/LogoLoader'

interface DelayedLoaderProps {
  delayMs?: number
  variant?: 'light' | 'admin'
  text?: string
}

/** Only shows a loader if navigation takes longer than `delayMs` (avoids flash on fast pages). */
export function DelayedLoader({
  delayMs = 400,
  variant = 'admin',
  text = 'Loading...',
}: DelayedLoaderProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  if (!show) return null

  return <LogoLoader fullScreen variant={variant} text={text} />
}
