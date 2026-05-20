'use server'

import { checkRateLimit, applicationSubmitLimit } from '@/lib/redis/ratelimit'
import { getClientIp } from '@/lib/auth/getClientIp'

export async function submitContactForm(data: {
  name: string
  email: string
  message: string
}): Promise<{ error?: string; success?: boolean }> {
  const ip = await getClientIp()
  const { allowed } = await checkRateLimit(applicationSubmitLimit, ip)

  if (!allowed) {
    return { error: 'Too many messages sent. Please try again later.' }
  }

  const name = data.name.trim()
  const email = data.email.trim().toLowerCase()
  const message = data.message.trim()

  if (!name || !email || !message) {
    return { error: 'Please fill in all fields' }
  }

  // Contact submissions are logged server-side; email integration can be added later.
  console.info('[contact]', { name, email, messageLength: message.length })

  return { success: true }
}
