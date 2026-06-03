'use server'

import { requireStaffAdmin } from '@/lib/auth/requireAdmin'
import { presignCourseMediaKey } from '@/lib/r2/course-media-urls'

/** Presigned preview URL for admin course edit after upload (24h TTL). */
export async function presignCourseMediaForPreview(
  r2Key: string,
): Promise<{ url: string | null } | { error: string }> {
  try {
    await requireStaffAdmin()
    const trimmed = r2Key.trim()
    if (!trimmed) {
      return { error: 'Invalid key' }
    }
    const url = await presignCourseMediaKey(trimmed)
    return { url }
  } catch {
    return { error: 'Unauthorized' }
  }
}
