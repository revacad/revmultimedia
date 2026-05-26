'use server'

import { checkRateLimit, applicationSubmitLimit } from '@/lib/redis/ratelimit'
import { getClientIp } from '@/lib/auth/getClientIp'
import { guardFormSubmission } from '@/lib/security/abuse'
import { sendContactForm } from '@/lib/notifications/email'
import { submitContactFormSchema } from '@/lib/validations/contact'

export async function submitContactForm(data: {
  website?: string
  name: string
  email: string
  phone?: string
  message: string
}): Promise<{ error?: string; success?: boolean }> {
  const ip = await getClientIp()

  const guard = await guardFormSubmission({
    form: 'contact',
    ip,
    email: data.email,
    honeypot: data.website,
    fieldValues: [data.name, data.email, data.phone ?? '', data.message],
  })
  if (!guard.ok) return { error: guard.error }

  const { allowed } = await checkRateLimit(applicationSubmitLimit, ip)
  if (!allowed) {
    return { error: 'Too many messages sent. Please try again later.' }
  }

  const parsed = submitContactFormSchema.safeParse(data)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Please fill in all required fields',
    }
  }

  const { name, email, phone, message } = parsed.data

  try {
    await sendContactForm({
      name,
      email,
      phone,
      message,
    })
  } catch (error) {
    console.error('[contact] send failed', error)
    return { error: 'Failed to send your message. Please try again or email us directly.' }
  }

  return { success: true }
}
