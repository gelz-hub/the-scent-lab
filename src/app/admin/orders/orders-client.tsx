'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Search, Eye, ShoppingCart, Loader2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ExportCsvLink } from '@/components/admin/export-csv-link'

type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'PREPARING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

interface AdminOrder {
  id: string
  number: string
  customerName: string
  email: string
  date: string
  items: number
  total: number
  status: OrderStatus
  payment: string | null
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  PREPARING: 'Preparing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

const STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-500/10 text-amber-600',
  PAYMENT_CONFIRMED: 'bg-brand/10 text-brand',
  PREPARING: 'bg-brand/10 text-brand',
  PACKED: 'bg-brand/10 text-brand',
  SHIPPED: 'bg-accent text-foreground',
  DELIVERED: 'bg-success/10 text-success',
  CANCELLED: 'bg-danger/10 text-danger',
}

type FilterValue = 'all' | OrderStatus

export function OrdersClient() {
  const [orders, setOrders] = React.useState<AdminOrder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')
  const [filter, setFilter] = React.useState<FilterValue>('all')

  React.useEffect(() => {
    fetch('/api/admin/orders')
      .then((res) => res.json())
      .then((data: { orders?: AdminOrder[] }) => setOrders(data.orders ?? []))
      .catch(() => toast.error('Could not load orders'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      const matchesFilter = filter === 'all' || o.status === filter
      const matchesQuery =
        !q ||
        o.number.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [orders, query, filter])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {orders.length} total orders · {filtered.length} shown
          </p>
        </div>
      </div>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-display text-lg font-medium tracking-tight">
              All orders
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by order # or customer..."
                  className="pl-9"
                  aria-label="Search orders"
                />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ExportCsvLink href="/api/admin/orders/export" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell text-center">Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Payment</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" strokeWidth={1.5} />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart className="h-8 w-8" strokeWidth={1.25} />
                      <div className="text-sm">
                        {orders.length === 0 ? 'No orders yet.' : 'No orders match your filters'}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="pl-6 font-mono text-xs font-medium">
                      {order.number}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {new Date(order.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center text-muted-foreground">
                      {order.items}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                          STATUS_CLASSES[order.status]
                        )}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {order.payment ?? '—'}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`View ${order.number}`}
                          onClick={() => toast('Order', { description: `${order.number} · ${order.customerName}` })}
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
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
    </div>
  )
}
