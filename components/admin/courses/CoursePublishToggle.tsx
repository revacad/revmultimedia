'use client'

import { useTransition } from 'react'
import { togglePublish } from '@/actions/course'

interface CoursePublishToggleProps {
  courseId: string
  isPublished: boolean
}

export default function CoursePublishToggle({
  courseId,
  isPublished,
}: CoursePublishToggleProps) {
  const [pending, startTransition] = useTransition()

  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span className="sr-only">{isPublished ? 'Published' : 'Draft'}</span>
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
        <input
          type="checkbox"
          checked={isPublished}
          disabled={pending}
          onChange={() => {
            startTransition(async () => {
              await togglePublish(courseId, !isPublished)
            })
          }}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-[#D8D8E8] transition-colors peer-checked:bg-[#C74A86] peer-disabled:opacity-50 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30" />
        <span className="absolute left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
      <span className="text-xs font-medium text-gray-600">
        {pending ? '…' : isPublished ? 'Published' : 'Draft'}
      </span>
    </label>
  )
}
