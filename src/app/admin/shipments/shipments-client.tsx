'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Search, Truck, Loader2, Pencil } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/format'
import { SHIPPING_STATUSES, shippingStatusLabel } from '@/lib/shipping/constants'
import { ShipmentEditDialog } from '@/components/admin/shipment-edit-dialog'
import { ExportCsvLink } from '@/components/admin/export-csv-link'

export interface AdminShipment {
  id: string
  orderId: string
  deliveryMethod: 'LOCAL_COURIER' | 'LOGISTICS'
  deliveryCompany: 'JT_EXPRESS' | 'VIREAK_BUNTHAM' | null
  shippingFee: number
  estimatedDelivery: string
  actualDeliveryAt: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  status: string
  internalNotes: string | null
  customerNotes: string | null
  archivedAt?: string | null
  order: {
    orderNumber: string
    total: number
    address: { province: string; district: string; recipientName: string; phone: string } | null
    user: { name: string | null; email: string }
  }
  statusEvents?: { id: string; status: string; note: string | null; createdAt: string; updatedBy: { name: string | null } | null }[]
  courierChanges?: {
    id: string
    previousCourier: string | null
    newCourier: string
    reason: string
    createdAt: string
    changedBy: { name: string | null } | null
  }[]
}

const STATUS_CLASSES: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  PREPARING: 'bg-amber-500/10 text-amber-600',
  READY_FOR_SHIPMENT: 'bg-amber-500/10 text-amber-600',
  SHIPPED: 'bg-brand/10 text-brand',
  IN_TRANSIT: 'bg-brand/10 text-brand',
  OUT_FOR_DELIVERY: 'bg-brand/10 text-brand',
  DELIVERED: 'bg-success/10 text-success',
  FAILED_DELIVERY: 'bg-danger/10 text-danger',
  RETURNED: 'bg-danger/10 text-danger',
  CANCELLED: 'bg-danger/10 text-danger',
}

export function ShipmentsClient() {
  const [shipments, setShipments] = React.useState<AdminShipment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [editing, setEditing] = React.useState<AdminShipment | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shipments')
      const data = await res.json()
      setShipments(data.shipments ?? [])
    } catch {
      toast.error('Could not load shipments')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return shipments.filter((s) => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      const matchesQuery =
        !q ||
        s.order.orderNumber.toLowerCase().includes(q) ||
        s.order.user.email.toLowerCase().includes(q) ||
        (s.order.address?.recipientName ?? '').toLowerCase().includes(q) ||
        (s.trackingNumber ?? '').toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [shipments, query, statusFilter])

  function handleSaved(updated: AdminShipment) {
    setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Shipments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {shipments.length} shipment{shipments.length === 1 ? '' : 's'} · assign couriers, add tracking, update status
        </p>
      </div>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-display text-lg font-medium tracking-tight">All shipments</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Order #, customer, tracking..."
                  className="pl-9"
                  aria-label="Search shipments"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                {SHIPPING_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ExportCsvLink href="/api/admin/shipments/export" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Order</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead className="hidden lg:table-cell">Destination</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="hidden sm:table-cell">Tracking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
                      <div className="text-sm">Loading shipments…</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="h-8 w-8" strokeWidth={1.25} />
                      <div className="text-sm">{query ? `No shipments match "${query}"` : 'No shipments yet.'}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6">
                      <div className="font-medium text-foreground">{s.order.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">{formatPrice(s.order.total)}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      <div>{s.order.user.name || s.order.address?.recipientName || '—'}</div>
                      <div className="text-xs">{s.order.user.email}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {s.order.address ? `${s.order.address.district}, ${s.order.address.province}` : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{s.deliveryMethod === 'LOCAL_COURIER' ? 'Local Courier' : 'Logistics'}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.deliveryCompany ? s.deliveryCompany.replace('_', ' ') : s.deliveryMethod === 'LOGISTICS' ? 'Unassigned' : '—'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {s.trackingNumber || '—'}
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', STATUS_CLASSES[s.status])}>
                        {shippingStatusLabel(s.status)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="icon" aria-label={`Edit shipment for ${s.order.orderNumber}`} onClick={() => setEditing(s)}>
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ShipmentEditDialog
        shipment={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={handleSaved}
      />
    </div>
  )
}
