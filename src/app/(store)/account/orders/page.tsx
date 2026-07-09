'use client'

import * as React from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatPrice, formatKHR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { BuyAgainButton } from '@/components/account/buy-again-button'

interface OrderItem {
  id: string
  name: string
  brand: string
  image: string
  ml: number
  price: number
  qty: number
}

interface OrderAddress {
  recipientName: string
  streetAddress: string
  district: string
  province: string
}

interface OrderPayment {
  method: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
}

interface OrderShipment {
  deliveryMethod: 'LOCAL_COURIER' | 'LOGISTICS'
  deliveryCompanyName: string
  status: string
  statusLabel: string
  trackingNumber: string | null
  trackingWebsite: string | null
  estimatedDelivery: string
}

interface OrderInvoice {
  invoiceNumber: string
  status: 'GENERATED' | 'FAILED'
}

interface Order {
  id: string
  orderNumber: string
  createdAt: string
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  items: OrderItem[]
  address: OrderAddress | null
  payment: OrderPayment | null
  shipment: OrderShipment | null
  invoice: OrderInvoice | null
}

const PAYMENT_STATUS_CLASSES: Record<string, string> = {
  PAID: 'bg-success/10 text-success',
  PENDING: 'bg-amber-500/10 text-amber-600',
  FAILED: 'bg-danger/10 text-danger',
  REFUNDED: 'bg-muted text-muted-foreground',
}

const SHIPMENT_ICON: Record<string, typeof Truck> = {
  DELIVERED: CheckCircle2,
  SHIPPED: Truck,
  IN_TRANSIT: Truck,
  OUT_FOR_DELIVERY: Truck,
}

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [viewing, setViewing] = React.useState<Order | null>(null)

  React.useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => toast.error('Could not load your orders'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDownloadInvoice(order: Order) {
    if (!order.invoice || order.invoice.status !== 'GENERATED') {
      toast.error('Invoice is not ready yet.')
      return
    }
    window.open(`/api/invoices/${order.id}/download`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            Order history
          </p>
          <h2 className="mt-1.5 font-display text-3xl font-medium tracking-tight">
            Your orders
          </h2>
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">
          {orders.length} order{orders.length === 1 ? '' : 's'} placed
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" strokeWidth={1.25} />
          <p className="mt-3 text-sm text-muted-foreground">You haven't placed any orders yet.</p>
          <Link href="/shop" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Order</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Delivery Company</TableHead>
                  <TableHead>Shipment Status</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <OrderRow key={o.id} order={o} onView={setViewing} onDownload={handleDownloadInvoice} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-4 md:hidden">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} onView={setViewing} onDownload={handleDownloadInvoice} />
            ))}
          </ul>
        </>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Package className="h-3.5 w-3.5" strokeWidth={1.5} />
        Need help with an order?{' '}
        <a href="/contact" className="text-foreground underline-offset-2 hover:underline">
          Contact support
        </a>
      </p>

      <OrderDetailDialog order={viewing} onOpenChange={(open) => !open && setViewing(null)} />
    </div>
  )
}

function OrderRow({
  order,
  onView,
  onDownload,
}: {
  order: Order
  onView: (o: Order) => void
  onDownload: (o: Order) => void
}) {
  return (
    <TableRow>
      <TableCell className="pl-6">
        <p className="font-medium">{order.orderNumber}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
      </TableCell>
      <TableCell>
        <Badge className={cn('font-medium', PAYMENT_STATUS_CLASSES[order.payment?.status ?? 'PENDING'])}>
          {order.payment?.status ?? 'PENDING'}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {order.shipment?.deliveryCompanyName ?? '—'}
      </TableCell>
      <TableCell>
        <ShipmentBadge shipment={order.shipment} />
      </TableCell>
      <TableCell>
        <InvoiceBadge invoice={order.invoice} />
      </TableCell>
      <TableCell className="font-medium">{formatPrice(order.total)}</TableCell>
      <TableCell className="pr-6">
        <OrderActions order={order} onView={onView} onDownload={onDownload} />
      </TableCell>
    </TableRow>
  )
}

function OrderCard({
  order,
  onView,
  onDownload,
}: {
  order: Order
  onView: (o: Order) => void
  onDownload: (o: Order) => void
}) {
  return (
    <li className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <Badge className={cn('font-medium', PAYMENT_STATUS_CLASSES[order.payment?.status ?? 'PENDING'])}>
          {order.payment?.status ?? 'PENDING'}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ShipmentBadge shipment={order.shipment} />
        <InvoiceBadge invoice={order.invoice} />
      </div>

      <ul className="mt-4 space-y-3">
        {order.items.slice(0, 2).map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.brand} {item.name}</p>
              <p className="text-xs text-muted-foreground">{item.ml}ml · Qty {item.qty}</p>
            </div>
            <p className="text-sm font-medium">{formatPrice(item.price * item.qty)}</p>
          </li>
        ))}
        {order.items.length > 2 && (
          <p className="text-xs text-muted-foreground">+{order.items.length - 2} more item(s)</p>
        )}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <p className="text-sm">
          <span className="text-muted-foreground">Total </span>
          <span className="font-medium">{formatPrice(order.total)}</span>
          <span className="ml-1.5 text-xs text-muted-foreground">({formatKHR(order.total)})</span>
        </p>
        <OrderActions order={order} onView={onView} onDownload={onDownload} />
      </div>
    </li>
  )
}

function ShipmentBadge({ shipment }: { shipment: OrderShipment | null }) {
  if (!shipment) {
    return <Badge variant="outline" className="text-muted-foreground">Not yet shipped</Badge>
  }
  const Icon = SHIPMENT_ICON[shipment.status] ?? Clock
  return (
    <Badge variant="secondary">
      <Icon className="h-3 w-3" strokeWidth={1.75} />
      {shipment.statusLabel}
    </Badge>
  )
}

function InvoiceBadge({ invoice }: { invoice: OrderInvoice | null }) {
  if (!invoice) {
    return <span className="text-xs text-muted-foreground">Not generated</span>
  }
  if (invoice.status === 'FAILED') {
    return <span className="text-xs text-danger">Generation failed</span>
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <FileText className="h-3 w-3 text-brand" strokeWidth={1.5} />
      {invoice.invoiceNumber}
    </span>
  )
}

function OrderActions({
  order,
  onView,
  onDownload,
}: {
  order: Order
  onView: (o: Order) => void
  onDownload: (o: Order) => void
}) {
  const canDownload = order.invoice?.status === 'GENERATED'
  const canTrack = !!order.shipment?.trackingWebsite

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="outline" size="sm" className="h-8 border-border text-xs hover:border-foreground/40" onClick={() => onView(order)}>
        View Order
      </Button>
      {canDownload && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 border-border text-xs hover:border-foreground/40"
        >
          <a href={`/api/invoices/${order.id}/view`} target="_blank" rel="noreferrer">
            <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
            View Invoice
          </a>
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="h-8 border-border text-xs hover:border-foreground/40"
        disabled={!canDownload}
        onClick={() => onDownload(order)}
      >
        <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
        Download Invoice
      </Button>
      {canTrack && (
        <Button asChild variant="outline" size="sm" className="h-8 border-border text-xs hover:border-foreground/40">
          <a href={order.shipment!.trackingWebsite!} target="_blank" rel="noreferrer">
            <Truck className="h-3.5 w-3.5" strokeWidth={1.5} />
            Track Shipment
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
          </a>
        </Button>
      )}
      <BuyAgainButton
        orderId={order.id}
        className="flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:border-foreground/40 disabled:opacity-50"
      />
    </div>
  )
}

function OrderDetailDialog({ order, onOpenChange }: { order: Order | null; onOpenChange: (open: boolean) => void }) {
  if (!order) return null

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{order.orderNumber}</DialogTitle>
          <DialogDescription>
            Placed {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Items</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.brand} {item.name} × {item.qty}</span>
                  <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          {order.address && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Deliver to</p>
              <p className="text-sm">{order.address.recipientName}</p>
              <p className="text-sm text-muted-foreground">
                {order.address.streetAddress}, {order.address.district}, {order.address.province}
              </p>
            </div>
          )}

          {order.shipment && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Shipment</p>
              <p className="text-sm">
                {order.shipment.deliveryCompanyName} · {order.shipment.statusLabel}
              </p>
              {order.shipment.trackingNumber && (
                <p className="text-sm text-muted-foreground">Tracking: {order.shipment.trackingNumber}</p>
              )}
              <p className="text-xs text-muted-foreground">{order.shipment.estimatedDelivery}</p>
            </div>
          )}

          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>−{formatPrice(order.discount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}</span></div>
            <div className="flex justify-between pt-1 text-base font-medium"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
