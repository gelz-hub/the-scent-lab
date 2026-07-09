'use client'

import * as React from 'react'
import Link from 'next/link'
import { Check, Download } from 'lucide-react'
import { formatPrice, formatKHR } from '@/lib/format'
import { OrderStatusTimeline } from './order-status-timeline'
import { PaymentPanel } from './payment-panel'
import type { OrderStatusValue } from '@/lib/checkout/constants'

export interface PlacedOrderPayment {
  paymentId: string
  status: string
  qrImageDataUrl?: string
  redirectUrl?: string
  formAction?: string
  formFields?: Record<string, string>
}

interface SuccessCardProps {
  orderNumber: string
  status: OrderStatusValue
  paymentMethod: string
  deliveryMethodLabel: string
  estimatedDelivery: string
  total: number
  payment: PlacedOrderPayment | null
}

export function SuccessCard({
  orderNumber,
  status,
  paymentMethod,
  deliveryMethodLabel,
  estimatedDelivery,
  total,
  payment: initialPayment,
}: SuccessCardProps) {
  // Local state so a retry (new Payment row, same order) swaps in without a
  // page reload — the retry endpoint never touches the order itself.
  const [payment, setPayment] = React.useState(initialPayment)
  const paymentStatusLabel = status === 'PENDING_PAYMENT' ? 'Awaiting payment' : 'Confirmed'

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10">
        <Check className="h-7 w-7 text-success" strokeWidth={2} />
      </div>
      <h1 className="mt-6 font-display text-4xl font-medium tracking-tight">Order confirmed</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Order <span className="font-medium text-foreground">{orderNumber}</span> — thank you.
        A confirmation has been sent and you can track it anytime from your account.
      </p>

      <div className="mt-8 rounded-xl border border-border p-6 text-left">
        <OrderStatusTimeline status={status} />

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Payment</dt>
            <dd className="mt-1 font-medium">{paymentStatusLabel}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Method</dt>
            <dd className="mt-1 font-medium">{paymentMethod.replace(/_/g, ' ')}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Delivery</dt>
            <dd className="mt-1 font-medium">{deliveryMethodLabel}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Estimated</dt>
            <dd className="mt-1 font-medium">{estimatedDelivery}</dd>
          </div>
        </dl>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
          <span className="text-sm text-muted-foreground">Order total</span>
          <span className="text-right">
            <span className="block font-display text-xl font-semibold">{formatPrice(total)}</span>
            <span className="block text-xs text-muted-foreground">{formatKHR(total)}</span>
          </span>
        </div>
      </div>

      {payment && payment.status !== 'PAID' && paymentMethod !== 'COD' && (
        <div className="mt-6">
          <PaymentPanel
            key={payment.paymentId}
            paymentId={payment.paymentId}
            initialStatus={payment.status}
            qrImageDataUrl={payment.qrImageDataUrl}
            redirectUrl={payment.redirectUrl}
            formAction={payment.formAction}
            formFields={payment.formFields}
            onRetried={(next) =>
              setPayment({
                paymentId: next.paymentId,
                status: next.status,
                qrImageDataUrl: next.qrImageDataUrl,
                redirectUrl: next.redirectUrl,
                formAction: next.formAction,
                formFields: next.formFields,
              })
            }
          />
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/account/orders"
          className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
        >
          View order
        </Link>
        <Link
          href="/shop"
          className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-foreground/40"
        >
          Continue shopping
        </Link>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-muted-foreground opacity-60"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          Download invoice
        </button>
      </div>
    </div>
  )
}
