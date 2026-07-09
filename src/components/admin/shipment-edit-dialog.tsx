'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { History, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SHIPPING_STATUSES, shippingStatusLabel } from '@/lib/shipping/constants'
import { LOGISTICS_COMPANIES, courierDisplayName, getCourier } from '@/lib/checkout/constants'
import type { AdminShipment } from '@/app/admin/shipments/shipments-client'

interface ShipmentEditDialogProps {
  shipment: AdminShipment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (shipment: AdminShipment) => void
}

export function ShipmentEditDialog({ shipment, open, onOpenChange, onSaved }: ShipmentEditDialogProps) {
  const [status, setStatus] = React.useState('')
  const [deliveryCompany, setDeliveryCompany] = React.useState<string>('')
  const [trackingNumber, setTrackingNumber] = React.useState('')
  const [trackingUrl, setTrackingUrl] = React.useState('')
  const [shippingFee, setShippingFee] = React.useState('')
  const [internalNotes, setInternalNotes] = React.useState('')
  const [customerNotes, setCustomerNotes] = React.useState('')
  const [statusNote, setStatusNote] = React.useState('')
  const [courierChangeReason, setCourierChangeReason] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [detail, setDetail] = React.useState<AdminShipment | null>(null)
  const [loadingDetail, setLoadingDetail] = React.useState(false)
  const [invoice, setInvoice] = React.useState<{ invoiceNumber: string; status: string } | null | undefined>(undefined)

  React.useEffect(() => {
    if (!shipment) return
    setStatus(shipment.status)
    setDeliveryCompany(shipment.deliveryCompany ?? '')
    setTrackingNumber(shipment.trackingNumber ?? '')
    setTrackingUrl(shipment.trackingUrl ?? '')
    setShippingFee(String(shipment.shippingFee))
    setInternalNotes(shipment.internalNotes ?? '')
    setCustomerNotes(shipment.customerNotes ?? '')
    setStatusNote('')
    setCourierChangeReason('')
    setDetail(null)
    setInvoice(undefined)

    setLoadingDetail(true)
    fetch(`/api/shipments/${shipment.id}`)
      .then((res) => res.json())
      .then((data) => setDetail(data.shipment ?? null))
      .catch(() => {})
      .finally(() => setLoadingDetail(false))

    fetch(`/api/invoices/${shipment.orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setInvoice(data?.invoice ?? null))
      .catch(() => setInvoice(null))
  }, [shipment])

  const isChangingCourier = shipment
    ? shipment.deliveryMethod === 'LOGISTICS' && deliveryCompany !== (shipment.deliveryCompany ?? '')
    : false

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!shipment) return

    if (isChangingCourier && !courierChangeReason.trim()) {
      toast.error('Please provide a reason for changing the courier.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/shipments/${shipment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          deliveryCompany: shipment.deliveryMethod === 'LOGISTICS' ? deliveryCompany || null : undefined,
          trackingNumber: trackingNumber || undefined,
          trackingUrl,
          shippingFee: Number(shippingFee),
          internalNotes,
          customerNotes,
          note: statusNote || undefined,
          courierChangeReason: isChangingCourier ? courierChangeReason : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not update shipment')
        return
      }
      toast.success('Shipment updated')
      onSaved({ ...shipment, ...data.shipment })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  if (!shipment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Shipment — {shipment.order.orderNumber}</DialogTitle>
          <DialogDescription>
            {shipment.order.address?.recipientName} · {shipment.order.address?.district}, {shipment.order.address?.province}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-sm">
          <span className="text-muted-foreground">Invoice</span>
          {invoice === undefined ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : invoice && invoice.status === 'GENERATED' ? (
            <span className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{invoice.invoiceNumber}</span>
              <a href={`/api/invoices/${shipment.orderId}/view`} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand hover:underline">
                View
              </a>
              <a href={`/api/invoices/${shipment.orderId}/download`} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand hover:underline">
                Download
              </a>
            </span>
          ) : invoice && invoice.status === 'FAILED' ? (
            <span className="flex items-center gap-2 text-xs text-danger">
              <span>{invoice.invoiceNumber} — generation failed</span>
            </span>
          ) : invoice && invoice.status === 'PENDING' ? (
            <span className="text-xs text-muted-foreground">{invoice.invoiceNumber} — reserved, not yet generated</span>
          ) : (
            <span className="text-xs text-muted-foreground">Not generated</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SHIPPING_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {shipment.deliveryMethod === 'LOGISTICS' && (
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                Courier <span className="text-muted-foreground/70">(customer selected: {courierDisplayName(shipment.deliveryCompany)})</span>
              </Label>
              <Select value={deliveryCompany || undefined} onValueChange={setDeliveryCompany}>
                <SelectTrigger><SelectValue placeholder="Not yet assigned" /></SelectTrigger>
                <SelectContent>
                  {LOGISTICS_COMPANIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {deliveryCompany && trackingNumber && getCourier(deliveryCompany)?.trackingWebsite && (
                <a
                  href={getCourier(deliveryCompany)!.trackingWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-xs text-brand hover:underline"
                >
                  Track on carrier site ↗
                </a>
              )}
              {isChangingCourier && (
                <div className="mt-2">
                  <Label htmlFor="courier-reason" className="mb-1.5 block text-xs text-muted-foreground">
                    Reason for changing the courier <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="courier-reason"
                    value={courierChangeReason}
                    onChange={(e) => setCourierChangeReason(e.target.value)}
                    placeholder="e.g. J&T unavailable for this destination today"
                    required
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    The customer chose {courierDisplayName(shipment.deliveryCompany)} at checkout — this change and its reason are recorded permanently.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tracking-number" className="mb-1.5 block text-xs text-muted-foreground">Tracking number</Label>
              <Input id="tracking-number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. JT1234567890" />
            </div>
            <div>
              <Label htmlFor="shipping-fee" className="mb-1.5 block text-xs text-muted-foreground">Shipping fee (USD)</Label>
              <Input id="shipping-fee" type="number" min="0" step="0.01" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="tracking-url" className="mb-1.5 block text-xs text-muted-foreground">Tracking URL (optional)</Label>
            <Input id="tracking-url" type="url" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <Label htmlFor="status-note" className="mb-1.5 block text-xs text-muted-foreground">
              Note for this status change (optional)
            </Label>
            <Input id="status-note" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="e.g. Handed to J&T at Chamkar Mon branch" />
          </div>

          <div>
            <Label htmlFor="customer-notes" className="mb-1.5 block text-xs text-muted-foreground">
              Customer notes <span className="text-muted-foreground/70">(shown to the customer, e.g. a delay explanation)</span>
            </Label>
            <Textarea id="customer-notes" rows={2} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="internal-notes" className="mb-1.5 block text-xs text-muted-foreground">
              Internal notes <span className="text-muted-foreground/70">(staff only — never shown to the customer)</span>
            </Label>
            <Textarea id="internal-notes" rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </div>

          {/* History */}
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <History className="h-3.5 w-3.5" strokeWidth={1.5} /> History
            </p>
            {loadingDetail ? (
              <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
              </div>
            ) : (
              <div className="space-y-3">
                {(detail?.courierChanges?.length ?? 0) > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Courier changes</p>
                    {detail!.courierChanges!.map((c) => (
                      <div key={c.id} className="rounded-md bg-surface px-2.5 py-2 text-xs">
                        <p>
                          {courierDisplayName(c.previousCourier)} → <span className="font-medium">{courierDisplayName(c.newCourier)}</span>
                        </p>
                        <p className="mt-0.5 text-muted-foreground">{c.reason}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {c.changedBy?.name ?? 'System'} · {new Date(c.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">Status timeline</p>
                  {(detail?.statusEvents?.length ?? 0) === 0 ? (
                    <p className="text-xs text-muted-foreground">No status changes yet.</p>
                  ) : (
                    detail!.statusEvents!.map((e) => (
                      <div key={e.id} className="rounded-md bg-surface px-2.5 py-2 text-xs">
                        <p className="font-medium">{shippingStatusLabel(e.status)}</p>
                        {e.note && <p className="mt-0.5 text-muted-foreground">{e.note}</p>}
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {e.updatedBy?.name ?? 'System'} · {new Date(e.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-foreground text-background hover:bg-brand hover:text-brand-foreground">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
