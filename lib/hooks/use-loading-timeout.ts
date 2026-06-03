'use client'

import { useEffect, useState } from 'react'

const DEFAULT_TIMEOUT_MS = 15_000

export function useLoadingTimeout(loading: boolean, timeoutMs = DEFAULT_TIMEOUT_MS): boolean {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!loading) {
      setTimedOut(false)
      return
    }

    const timer = window.setTimeout(() => setTimedOut(true), timeoutMs)
    return () => window.clearTimeout(timer)
  }, [loading, timeoutMs])

  return loading && timedOut
}
