import { after } from 'next/server'

export function runAfterResponse(fn: () => Promise<void>) {
  try {
    after(fn)
  } catch {
    fn().catch((err) => console.error('Background task failed:', err))
  }
}
