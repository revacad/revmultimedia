import { cache } from 'react'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'

/** One authenticated Supabase user per request across portal layout + pages. */
export const getPortalAuthUser = cache(() => requirePortalUser())
