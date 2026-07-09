'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import { paymentStatusLabel } from '@/lib/payment/config'

interface PaymentDetail {
  id: string
  method: string
  provider: string
  status: string
  totalAmount: number
  currency: string
  subtotal: number
  shippingFee: number
  discount: number
  paidAt: string | null
  expiresAt: string | null
  createdAt: string
  providerReference: string | null
  providerTransactionId: string | null
  failureReason: string | null
  rawResponse: unknown
  order: { orderNumber: string; user: { name: string | null; email: string } }
  events: { id: string; status: string; message: string | null; createdAt: string; createdBy: { name: string | null } | null }[]
}

interface PaymentDetailDialogProps {
  paymentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}

export function PaymentDetailDialog({ paymentId, open, onOpenChange, onChanged }: PaymentDetailDialogProps) {
  const [detail, setDetail] = React.useState<PaymentDetail | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [verifying, setVerifying] = React.useState(false)
  const [markingCod, setMarkingCod] = React.useState(false)

  const load = React.useCallback(async () => {
    if (!paymentId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`)
      const data = await res.json()
      setDetail(data.payment ?? null)
    } catch {
      toast.error('Could not load payment detail')
    } finally {
      setLoading(false)
    }
  }, [paymentId])

  React.useEffect(() => {
    if (open) load()
    else setDetail(null)
  }, [open, load])

  async function handleVerify() {
    if (!paymentId) return
    setVerifying(true)
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/verify`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Verification failed')
        return
      }
      toast.success(`Payment status: ${paymentStatusLabel(data.status)}`)
      await load()
      onChanged()
    } catch {
      toast.error('Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  async function handleMarkCodCollected() {
    if (!paymentId) return
    setMarkingCod(true)
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/mark-cod-collected`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not mark as collected')
        return
      }
      toast.success('Cash collection confirmed')
      await load()
      onChanged()
    } catch {
      toast.error('Could not mark as collected')
    } finally {
      setMarkingCod(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment detail</DialogTitle>
          <DialogDescription>
            {detail ? `Order ${detail.order.orderNumber} · ${detail.order.user.email}` : 'Loading…'}
          </DialogDescription>
        </DialogHeader>

        {loading || !detail ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
          </div>
        ) : (
          <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1 text-sm">
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd className="font-medium">{paymentStatusLabel(detail.status)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Method / Provider</dt>
                <dd className="font-medium">{detail.method.replace(/_/g, ' ')} · {detail.provider}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Amount</dt>
                <dd className="font-medium">{formatPrice(detail.totalAmount)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Paid at</dt>
                <dd className="font-medium">{detail.paidAt ? new Date(detail.paidAt).toLocaleString() : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Provider reference</dt>
                <dd className="break-all font-mono text-xs">{detail.providerReference || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Provider transaction ID</dt>
                <dd className="break-all font-mono text-xs">{detail.providerTransactionId || '—'}</dd>
              </div>
              {detail.failureReason && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Failure reason</dt>
                  <dd className="font-medium text-danger">{detail.failureReason}</dd>
                </div>
              )}
            </dl>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Timeline</p>
              <ul className="space-y-2 border-l border-border pl-4">
                {detail.events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-brand" />
                    <p className="font-medium">{paymentStatusLabel(e.status)}</p>
                    {e.message && <p className="text-xs text-muted-foreground">{e.message}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString()}
                      {e.createdBy?.name ? ` · ${e.createdBy.name}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {detail.rawResponse != null && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Provider response</p>
                <pre className="max-h-40 overflow-auto rounded-md bg-surface p-3 text-xs">
                  {JSON.stringify(detail.rawResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {detail?.method === 'COD' && detail.status !== 'PAID' ? (
            <Button variant="secondary" onClick={handleMarkCodCollected} disabled={markingCod}>
              {markingCod ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" strokeWidth={1.5} />}
              Confirm cash collected
            </Button>
          ) : (
            <span />
          )}
          {detail && detail.status !== 'PAID' && detail.method !== 'COD' && (
            <Button onClick={handleVerify} disabled={verifying}>
              {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" strokeWidth={1.5} />}
              Re-verify with provider
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
