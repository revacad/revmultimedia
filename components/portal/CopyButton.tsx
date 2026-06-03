'use client'

import CopyIconButton from '@/components/ui/CopyIconButton'

export default function CopyButton({ text }: { text: string; label?: string }) {
  return <CopyIconButton text={text} />
}
