// PaymentService — creates, verifies, and tracks payments. Never generates
// invoices or sends notifications itself (see src/lib/payment/README.md for
// the orchestration boundary: an API route calls this service, observes the
// resulting status, and separately calls InvoiceService/NotificationService
// only when it sees PAID).

import { db } from '@/lib/db'
import { getPaymentProvider } from './providers'
import { PAYMENT_TIMEOUT_MINUTES, PAYMENT_RETRY_LIMIT } from './config'
import { logPaymentEvent } from './monitoring'
import type { PaymentStatus } from '@prisma/client'

interface OrderForPayment {
  id: string
  orderNumber: string
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  user: { email: string; name: string | null }
  address: { recipientName: string } | null
}

export interface PaymentCreationResult {
  paymentId: string
  status: PaymentStatus
  qrPayload?: string
  qrImageDataUrl?: string
  redirectUrl?: string
  formAction?: string
  formFields?: Record<string, string>
  expiresAt: Date | null
}

interface StoredCreationDetails {
  qrPayload?: string
  qrImageDataUrl?: string
  redirectUrl?: string
  formAction?: string
  formFields?: Record<string, string>
}

/** Statuses a payment can never leave — a retry always creates a brand new Payment row instead. */
const TERMINAL_ATTEMPT_STATUSES: PaymentStatus[] = ['FAILED', 'EXPIRED', 'CANCELLED']

async function logEvent(paymentId: string, status: PaymentStatus, message: string, providerResponse?: unknown, createdById?: string) {
  await db.paymentEvent.create({
    data: { paymentId, status, message, providerResponse: providerResponse as never, createdById },
  })
}

/** Everything a client needs to complete a payment attempt (QR, redirect, or an
 * auto-submit form) is stashed in `rawResponse` at creation time and replayed
 * back out unchanged on every idempotent reuse — this is the single place
 * both directions of that mapping happen. */
function creationDetailsFrom(rawResponse: unknown): StoredCreationDetails {
  return (rawResponse as StoredCreationDetails | null) ?? {}
}

async function callProviderCreate(order: OrderForPayment, method: string) {
  const provider = getPaymentProvider(method)
  const customerName = order.address?.recipientName || order.user.name || 'Customer'

  const providerResult = await provider.createPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.total,
    currency: 'USD',
    customerEmail: order.user.email,
    customerName,
    timeoutMinutes: PAYMENT_TIMEOUT_MINUTES,
  })

  const payment = await db.payment.create({
    data: {
      orderId: order.id,
      method: method as never,
      provider: provider.name,
      providerReference: providerResult.providerReference,
      providerTransactionId: providerResult.providerTransactionId,
      currency: 'USD',
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      discount: order.discount,
      totalAmount: order.total,
      status: 'PENDING',
      expiresAt: providerResult.expiresAt,
      rawResponse: {
        qrPayload: providerResult.qrPayload,
        qrImageDataUrl: providerResult.qrImageDataUrl,
        redirectUrl: providerResult.redirectUrl,
        formAction: providerResult.formAction,
        formFields: providerResult.formFields,
      } as never,
    },
  })

  await logEvent(payment.id, 'PENDING', 'Payment created', providerResult.rawResponse)
  logPaymentEvent('payment_created', { paymentId: payment.id, orderId: order.id, method, provider: provider.name })

  return {
    paymentId: payment.id,
    status: payment.status,
    qrPayload: providerResult.qrPayload,
    qrImageDataUrl: providerResult.qrImageDataUrl,
    redirectUrl: providerResult.redirectUrl,
    formAction: providerResult.formAction,
    formFields: providerResult.formFields,
    expiresAt: payment.expiresAt,
  }
}

/**
 * Creates the first payment attempt for an order — idempotent by design: if
 * a Payment already exists for this orderId, the most recent one is returned
 * as-is rather than creating a duplicate. This is what prevents double-click
 * / refresh-after-payment / duplicate order-creation calls from ever
 * producing two competing payment attempts for the same order.
 *
 * Once an attempt reaches a terminal state (FAILED/EXPIRED/CANCELLED), this
 * function will NOT create a new one — that's what createRetryPayment is
 * for, invoked as an explicit customer/staff action, never automatically.
 */
export async function createPayment(order: OrderForPayment, method: string): Promise<PaymentCreationResult> {
  const existing = await db.payment.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: 'desc' } })
  if (existing) {
    return { paymentId: existing.id, status: existing.status, expiresAt: existing.expiresAt, ...creationDetailsFrom(existing.rawResponse) }
  }

  try {
    return await callProviderCreate(order, method)
  } catch (error) {
    logPaymentEvent('payment_creation_failed', { orderId: order.id, method, error })
    throw error
  }
}

/**
 * Explicit retry: the customer's previous attempt expired or failed. Creates
 * a brand new Payment row against the SAME order — never a new order, and
 * the old Payment row (and its full event history) is left untouched
 * permanently. Bounded by PAYMENT_RETRY_LIMIT so a broken client can't spam
 * unlimited payment attempts against one order.
 */
export async function createRetryPayment(order: OrderForPayment, method: string): Promise<PaymentCreationResult> {
  const attempts = await db.payment.findMany({ where: { orderId: order.id }, orderBy: { createdAt: 'desc' } })
  const latest = attempts[0]

  if (latest && !TERMINAL_ATTEMPT_STATUSES.includes(latest.status)) {
    // Still active (PENDING/PROCESSING/PAID) — nothing to retry, return it as-is.
    return { paymentId: latest.id, status: latest.status, expiresAt: latest.expiresAt, ...creationDetailsFrom(latest.rawResponse) }
  }

  if (attempts.length >= PAYMENT_RETRY_LIMIT) {
    logPaymentEvent('retry_blocked', { orderId: order.id, reason: 'retry limit reached', attempts: attempts.length })
    throw new Error('This order has reached its maximum number of payment attempts. Please contact support.')
  }

  logPaymentEvent('retry_attempted', { orderId: order.id, method, attemptNumber: attempts.length + 1 })

  try {
    return await callProviderCreate(order, method)
  } catch (error) {
    logPaymentEvent('payment_creation_failed', { orderId: order.id, method, error })
    throw error
  }
}

/**
 * Verifies a payment against its provider — never trusts a client-supplied
 * status. Idempotent: a payment already in a terminal state (PAID, FAILED,
 * EXPIRED, CANCELLED) short-circuits without re-calling the provider or
 * re-logging an event, so duplicate polls/webhooks are safe. Expired
 * payments can never become PAID — the expiry check runs before any
 * provider call.
 */
export async function verifyPayment(paymentId: string): Promise<PaymentStatus> {
  const payment = await db.payment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error('Payment not found.')

  // Fully terminal — never re-verified, never re-enters the provider path.
  if (payment.status === 'PAID' || TERMINAL_ATTEMPT_STATUSES.includes(payment.status)) {
    return payment.status
  }

  if (payment.expiresAt && payment.expiresAt.getTime() < Date.now()) {
    await db.payment.update({ where: { id: payment.id }, data: { status: 'EXPIRED' } })
    await logEvent(payment.id, 'EXPIRED', 'Payment expired before verification could complete')
    logPaymentEvent('payment_expired', { paymentId: payment.id, orderId: payment.orderId, reason: 'expired at verification time' })
    return 'EXPIRED'
  }

  let result
  try {
    const provider = getPaymentProvider(payment.method)
    result = await provider.verifyPayment({
      id: payment.id,
      providerReference: payment.providerReference,
      providerTransactionId: payment.providerTransactionId,
      totalAmount: payment.totalAmount,
      currency: payment.currency,
      expiresAt: payment.expiresAt,
    })
  } catch (error) {
    logPaymentEvent('verification_failed', { paymentId: payment.id, orderId: payment.orderId, error })
    return payment.status // provider unreachable — leave status untouched, caller can retry later
  }

  if (result.status === 'PAID') {
    // Re-check expiry immediately before finalizing — closes the race where
    // the payment expired between the check above and the provider round-trip.
    if (payment.expiresAt && payment.expiresAt.getTime() < Date.now()) {
      await db.payment.update({ where: { id: payment.id }, data: { status: 'EXPIRED' } })
      await logEvent(payment.id, 'EXPIRED', 'Payment expired; provider confirmation arrived too late to accept')
      logPaymentEvent('payment_expired', { paymentId: payment.id, orderId: payment.orderId, reason: 'provider confirmed after expiry' })
      return 'EXPIRED'
    }

    // Duplicate-webhook guard: providerTransactionId is unique at the DB
    // level, so a second callback for the same transaction id fails here
    // rather than double-processing.
    const updated = await db.payment
      .update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: result.paidAt || new Date(),
          providerTransactionId: result.providerTransactionId || payment.providerTransactionId,
        },
      })
      .catch(() => null)

    if (!updated) return payment.status // another request already finalized this payment

    await logEvent(payment.id, 'PAID', 'Payment verified', result.rawResponse)
    return 'PAID'
  }

  if (result.status === 'EXPIRED') {
    await db.payment.update({ where: { id: payment.id }, data: { status: 'EXPIRED' } })
    await logEvent(payment.id, 'EXPIRED', 'Payment expired', result.rawResponse)
    logPaymentEvent('payment_expired', { paymentId: payment.id, orderId: payment.orderId, reason: 'provider reported expired' })
    return 'EXPIRED'
  }

  if (result.status === 'FAILED') {
    await db.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: result.failureReason } })
    await logEvent(payment.id, 'FAILED', result.failureReason || 'Payment failed', result.rawResponse)
    return 'FAILED'
  }

  if (result.status === 'PROCESSING' && payment.status !== 'PROCESSING') {
    await db.payment.update({ where: { id: payment.id }, data: { status: 'PROCESSING' } })
    await logEvent(payment.id, 'PROCESSING', 'Payment processing', result.rawResponse)
    return 'PROCESSING'
  }

  return payment.status // still PENDING, nothing to change
}

/** Staff-only — COD is confirmed paid on delivery, never auto-verified through a provider. */
export async function markCodCollected(paymentId: string, staffUserId: string): Promise<PaymentStatus> {
  const payment = await db.payment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error('Payment not found.')
  if (payment.method !== 'COD') throw new Error('This action only applies to Cash on Delivery payments.')
  if (payment.status === 'PAID') return payment.status
  if (TERMINAL_ATTEMPT_STATUSES.includes(payment.status)) {
    throw new Error(`This payment is ${payment.status.toLowerCase()} and can no longer be marked as paid.`)
  }

  await db.payment.update({ where: { id: paymentId }, data: { status: 'PAID', paidAt: new Date() } })
  await logEvent(paymentId, 'PAID', 'Cash collected on delivery, confirmed by staff', undefined, staffUserId)
  return 'PAID'
}

export async function markCancelled(paymentId: string, staffUserId?: string, reason?: string): Promise<PaymentStatus> {
  await db.payment.update({ where: { id: paymentId }, data: { status: 'CANCELLED' } })
  await logEvent(paymentId, 'CANCELLED', reason || 'Payment cancelled', undefined, staffUserId)
  return 'CANCELLED'
}

/** The order's current payment — its most recent attempt. Full history is preserved but this is what UIs should show by default. */
export async function getPaymentForOrder(orderId: string) {
  return db.payment.findFirst({ where: { orderId }, orderBy: { createdAt: 'desc' } })
}

/** Every payment attempt ever made for this order, oldest first — never filtered or deleted. */
export async function getPaymentHistoryForOrder(orderId: string) {
  return db.payment.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } })
}

/**
 * Background-friendly expiration sweep — marks any PENDING/PROCESSING
 * payment whose expiresAt has passed as EXPIRED and logs a PaymentEvent for
 * each. Never touches the Order (see src/lib/payment/README.md — expiration
 * is a payment-attempt concern, not an order-cancellation trigger). Designed
 * to be called from a scheduled worker (Vercel Cron, node-cron, etc.) via
 * /api/cron/expire-payments, but is plain, dependency-free application logic
 * so it can also run from a script or test.
 */
export async function expireOverduePayments(): Promise<{ expiredCount: number; expiredIds: string[] }> {
  const overdue = await db.payment.findMany({
    where: {
      status: { in: ['PENDING', 'PROCESSING'] },
      expiresAt: { lt: new Date() },
    },
  })

  const expiredIds: string[] = []
  for (const payment of overdue) {
    const updated = await db.payment
      .updateMany({
        where: { id: payment.id, status: payment.status }, // guards against a concurrent verify() winning the race
        data: { status: 'EXPIRED' },
      })
      .catch(() => ({ count: 0 }))

    if (updated.count === 0) continue // already transitioned by a concurrent verify() call

    await logEvent(payment.id, 'EXPIRED', 'Payment automatically expired by scheduled sweep')
    logPaymentEvent('payment_expired', { paymentId: payment.id, orderId: payment.orderId, reason: 'scheduled sweep' })
    expiredIds.push(payment.id)
  }

  return { expiredCount: expiredIds.length, expiredIds }
}
