'use server'

import { checkRateLimit, applicationSubmitLimit } from '@/lib/redis/ratelimit'
import { getClientIp } from '@/lib/auth/getClientIp'
import { sendContactForm } from '@/lib/notifications/email'

export async function submitContactForm(data: {
  name: string
  email: string
  phone?: string
  message: string
}): Promise<{ error?: string; success?: boolean }> {
  const ip = await getClientIp()
  const { allowed } = await checkRateLimit(applicationSubmitLimit, ip)

  if (!allowed) {
    return { error: 'Too many messages sent. Please try again later.' }
  }

  const name = data.name.trim()
  const email = data.email.trim().toLowerCase()
  const phone = data.phone?.trim()
  const message = data.message.trim()

  if (!name || !email || !message) {
    return { error: 'Please fill in all required fields' }
  }

  try {
    await sendContactForm({
      name,
      email,
      phone: phone || undefined,
      message,
    })
  } catch (error) {
    console.error('[contact] send failed', error)
    return { error: 'Failed to send your message. Please try again or email us directly.' }
  }

  return { success: true }
}
