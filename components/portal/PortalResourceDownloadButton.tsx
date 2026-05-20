'use client'

import { useTransition } from 'react'
import Button from '@/components/ui/Button'
import { getResourceUrl } from '@/actions/resources'

interface PortalResourceDownloadButtonProps {
  resourceId: string
}

export default function PortalResourceDownloadButton({
  resourceId,
}: PortalResourceDownloadButtonProps) {
  const [pending, startTransition] = useTransition()

  function handleDownload() {
    startTransition(async () => {
      try {
        const url = await getResourceUrl(resourceId)
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch {
        // silent — page can add toast later
      }
    })
  }

  return (
    <Button
      variant="primary"
      size="sm"
      className="mt-4 w-full"
      disabled={pending}
      onClick={handleDownload}
    >
      {pending ? 'Preparing…' : 'Download'}
    </Button>
  )
}
