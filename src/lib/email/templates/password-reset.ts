import { emailShell } from './layout'

export interface PasswordResetEmailData {
  customerName: string
  resetUrl: string
}

export function passwordResetSubject() {
  return 'Reset Your Password'
}

export function passwordResetEmail(data: PasswordResetEmailData) {
  const body = `
    <p style="margin:0 0 16px;">Hi ${data.customerName}, we received a request to reset your password.</p>
    <p style="margin:0 0 16px;">Click the button below to choose a new one. This link expires in 1 hour and can only be used once.</p>
    <p style="margin:20px 0 0;color:#6B7A73;font-size:12px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
  `

  return emailShell({
    preheader: 'Reset your The Scent Lab password.',
    heading: 'Reset Your Password',
    body,
    ctaLabel: 'Reset Password',
    ctaUrl: data.resetUrl,
  })
}
