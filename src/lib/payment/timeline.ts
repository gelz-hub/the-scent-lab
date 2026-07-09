// Builds the customer-facing payment timeline — a small, fixed set of
// human-readable milestones derived from PaymentEvent rows, never the raw
// events themselves (no provider responses, no internal status jargon, no
// staff identities). Reusable by any future UI (checkout page, account
// orders page, order detail) since it returns plain, serializable steps.

import type { PaymentStatus } from '@prisma/client'

export interface PaymentTimelineStep {
  key: 'created' | 'waiting' | 'verified' | 'invoice' | 'preparing' | 'failed' | 'expired' | 'cancelled'
  label: string
  description: string
  completedAt: string | null
  status: 'done' | 'current' | 'upcoming' | 'blocked'
}

interface PaymentEventLike {
  status: PaymentStatus
  createdAt: Date
}

interface BuildTimelineInput {
  paymentStatus: PaymentStatus
  events: PaymentEventLike[]
  invoiceGeneratedAt: Date | null
  orderIsPreparing: boolean
}

function firstEventAt(events: PaymentEventLike[], status: PaymentStatus): string | null {
  const match = events.find((e) => e.status === status)
  return match ? match.createdAt.toISOString() : null
}

/**
 * Terminal-attempt statuses short-circuit the happy path into a single
 * "what happened" step — a customer never needs to see "Waiting for
 * Payment" still marked upcoming once their payment has already failed.
 */
export function buildPaymentTimeline(input: BuildTimelineInput): PaymentTimelineStep[] {
  const { paymentStatus, events, invoiceGeneratedAt, orderIsPreparing } = input
  const createdAt = firstEventAt(events, 'PENDING')

  const createdStep: PaymentTimelineStep = {
    key: 'created',
    label: 'Payment Created',
    description: 'Your payment was created and is ready to be completed.',
    completedAt: createdAt,
    status: 'done',
  }

  if (paymentStatus === 'FAILED') {
    return [
      createdStep,
      {
        key: 'failed',
        label: 'Payment Failed',
        description: 'This payment attempt could not be completed. You can start a new attempt.',
        completedAt: firstEventAt(events, 'FAILED'),
        status: 'blocked',
      },
    ]
  }

  if (paymentStatus === 'EXPIRED') {
    return [
      createdStep,
      {
        key: 'expired',
        label: 'Payment Expired',
        description: 'This payment link expired before it was completed. You can start a new attempt.',
        completedAt: firstEventAt(events, 'EXPIRED'),
        status: 'blocked',
      },
    ]
  }

  if (paymentStatus === 'CANCELLED') {
    return [
      createdStep,
      {
        key: 'cancelled',
        label: 'Payment Cancelled',
        description: 'This payment was cancelled.',
        completedAt: firstEventAt(events, 'CANCELLED'),
        status: 'blocked',
      },
    ]
  }

  const isPaid = paymentStatus === 'PAID'
  const isWaiting = paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING'

  const waitingStep: PaymentTimelineStep = {
    key: 'waiting',
    label: 'Waiting for Payment',
    description: 'We are waiting for your payment to be confirmed.',
    completedAt: isPaid ? (firstEventAt(events, 'PAID') ?? createdAt) : null,
    status: isPaid ? 'done' : isWaiting ? 'current' : 'upcoming',
  }

  const verifiedStep: PaymentTimelineStep = {
    key: 'verified',
    label: 'Payment Verified',
    description: 'Your payment has been confirmed.',
    completedAt: isPaid ? firstEventAt(events, 'PAID') : null,
    status: isPaid ? 'done' : 'upcoming',
  }

  const invoiceStep: PaymentTimelineStep = {
    key: 'invoice',
    label: 'Invoice Generated',
    description: 'An invoice for your order has been generated.',
    completedAt: invoiceGeneratedAt ? invoiceGeneratedAt.toISOString() : null,
    status: invoiceGeneratedAt ? 'done' : isPaid ? 'current' : 'upcoming',
  }

  const preparingStep: PaymentTimelineStep = {
    key: 'preparing',
    label: 'Preparing Order',
    description: 'Your order is being prepared for delivery.',
    completedAt: null,
    status: orderIsPreparing ? 'done' : invoiceGeneratedAt ? 'current' : 'upcoming',
  }

  return [createdStep, waitingStep, verifiedStep, invoiceStep, preparingStep]
}
