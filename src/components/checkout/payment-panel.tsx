'use client'

import * as React from 'react'
import Image from 'next/image'
import { Loader2, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react'

interface RetriedPayment {
  paymentId: string
  status: string
  qrImageDataUrl?: string
  redirectUrl?: string
  formAction?: string
  formFields?: Record<string, string>
  expiresAt: string | null
}

interface PaymentPanelProps {
  paymentId: string
  initialStatus: string
  qrImageDataUrl?: string
  redirectUrl?: string
  /** ABA PayWay hosted checkout — the browser itself must submit these
   * fields (they include a server-computed hash) directly to `formAction`.
   * See src/lib/payment/providers/aba-payway-provider.ts. */
  formAction?: string
  formFields?: Record<string, string>
  onStatusChange?: (status: string) => void
  onRetried?: (payment: RetriedPayment) => void
}

const TERMINAL = new Set(['PAID', 'FAILED', 'EXPIRED', 'CANCELLED'])
// Mirrors PAYMENT_POLL_INTERVAL_MS in src/lib/payment/config.ts — kept as a
// plain constant here since client components can't read server env vars.
const POLL_INTERVAL_MS = 4000

/** Polls /api/payments/[id]/verify — lets the customer see their payment
 * settle without reloading the page. Backend verification is the only path
 * that can ever move a payment to PAID; this panel just observes it. */
export function PaymentPanel({
  paymentId,
  initialStatus,
  qrImageDataUrl,
  redirectUrl,
  formAction,
  formFields,
  onStatusChange,
  onRetried,
}: PaymentPanelProps) {
  const [status, setStatus] = React.useState(initialStatus)
  const [checking, setChecking] = React.useState(false)
  const [retrying, setRetrying] = React.useState(false)
  const [retryError, setRetryError] = React.useState<string | null>(null)

  const check = React.useCallback(async () => {
    setChecking(true)
    try {
      const res = await fetch(`/api/payments/${paymentId}/verify`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (data?.status) {
        setStatus(data.status)
        onStatusChange?.(data.status)
      }
    } catch {
      // Silent — the next poll tick retries.
    } finally {
      setChecking(false)
    }
  }, [paymentId, onStatusChange])

  async function handleRetry() {
    setRetrying(true)
    setRetryError(null)
    try {
      const res = await fetch(`/api/payments/${paymentId}/retry`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.payment) {
        setRetryError(data?.error || 'Unable to start a new payment attempt.')
        return
      }
      onRetried?.(data.payment)
    } catch {
      setRetryError('Unable to start a new payment attempt.')
    } finally {
      setRetrying(false)
    }
  }

  React.useEffect(() => {
    if (TERMINAL.has(status)) return
    const interval = setInterval(check, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [status, check])

  if (status === 'PAID') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
        <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={1.5} />
        <span className="font-medium">Payment received — thank you.</span>
      </div>
    )
  }

  if (status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED') {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm">
        <p className="font-medium">
          {status === 'EXPIRED' ? 'This payment link has expired.' : 'This payment could not be completed.'}
        </p>
        {status !== 'CANCELLED' ? (
          <>
            <p className="mt-1 text-muted-foreground">Your order is still saved — you can try paying again.</p>
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="mt-3 rounded-lg bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground disabled:opacity-60"
            >
              {retrying ? 'Starting new attempt…' : 'Try again'}
            </button>
            {retryError && <p className="mt-2 text-xs text-danger">{retryError}</p>}
          </>
        ) : (
          <p className="mt-1 text-muted-foreground">Please contact support if you believe this is a mistake.</p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border p-6 text-center">
      <p className="text-sm font-medium">Complete your payment</p>

      {qrImageDataUrl && (
        <div className="mx-auto mt-4 w-fit rounded-lg border border-border p-3">
          <Image src={qrImageDataUrl} alt="Scan to pay with KHQR" width={220} height={220} />
        </div>
      )}

      {redirectUrl && (
        <a
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
          Continue to payment
        </a>
      )}

      {formAction && formFields && (
        // ABA PayWay's hosted checkout requires the customer's OWN browser to
        // submit these fields (a server-computed hash included) directly to
        // ABA — never fetched or redirected server-side. A real <form> POST,
        // not a link, is required here.
        <form action={formAction} method="POST" encType="multipart/form-data" target="_blank" className="mt-4">
          {Object.entries(formFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
            Continue to payment
          </button>
        </form>
      )}

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        Waiting for payment confirmation — this updates automatically.
      </p>
      <button
        type="button"
        onClick={check}
        disabled={checking}
        className="mt-2 text-xs font-medium text-brand underline underline-offset-2 disabled:opacity-50"
      >
        Check now
      </button>
    </div>
  )
}
