import nodemailer from 'nodemailer'

// Fallback transport for when RESEND_API_KEY isn't set — lets password reset
// (and anything else routed through here) work with just a free Gmail
// account + app password, no paid email API required. See README in
// src/lib/email for setup: create an "App Password" at
// https://myaccount.google.com/apppasswords and set GMAIL_USER / GMAIL_APP_PASSWORD.
export const isSmtpConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (!isSmtpConfigured) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }
  return transporter
}

export async function sendViaSmtp(opts: { to: string; subject: string; html: string }) {
  const transport = getTransporter()
  if (!transport) return false

  await transport.sendMail({
    from: `The Scent Lab <${process.env.GMAIL_USER}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  })
  return true
}
