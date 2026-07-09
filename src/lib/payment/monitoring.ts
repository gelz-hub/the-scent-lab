// Structured, greppable logging for payment operations — never surfaced to
// customers (API routes always return a generic message on failure). This is
// the single place these categories are logged from, so any future export to
// a real monitoring backend (Sentry, Datadog, etc.) only touches this file.

type PaymentLogEvent =
  | 'payment_created'
  | 'payment_creation_failed'
  | 'verification_failed'
  | 'webhook_received'
  | 'webhook_failed'
  | 'webhook_duplicate'
  | 'payment_expired'
  | 'retry_attempted'
  | 'retry_blocked'

interface PaymentLogContext {
  paymentId?: string
  orderId?: string
  provider?: string
  method?: string
  reason?: string
  error?: unknown
  [key: string]: unknown
}

export function logPaymentEvent(event: PaymentLogEvent, context: PaymentLogContext = {}) {
  const { error, ...rest } = context
  const entry = {
    scope: 'payment',
    event,
    ...rest,
    ...(error !== undefined && { error: error instanceof Error ? error.message : String(error) }),
    timestamp: new Date().toISOString(),
  }

  if (event.endsWith('_failed') || event === 'retry_blocked') {
    console.error('[payment]', JSON.stringify(entry))
  } else {
    console.warn('[payment]', JSON.stringify(entry))
  }
}
