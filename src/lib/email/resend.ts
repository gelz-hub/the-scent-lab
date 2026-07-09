import { Resend } from 'resend'

export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY)

let client: Resend | null = null

export function getResendClient(): Resend | null {
  if (!isEmailConfigured) return null
  if (!client) client = new Resend(process.env.RESEND_API_KEY)
  return client
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'The Scent Lab <orders@thescentlab.com>'
