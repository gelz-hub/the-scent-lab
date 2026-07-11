'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package,
  Tag,
  LayoutGrid,
  Sparkles,
  ShoppingCart,
  Users,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/site/empty-state'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'PREPARING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

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

interface RecentOrder {
  id: string
  number: string
  customerName: string
  email: string
  date: string
  status: OrderStatus
  total: number
}

interface RecentProduct {
  id: string
  name: string
  brand: string
  slug: string
  image: string
  createdAt: string
}

interface DashboardPayload {
  totalProducts?: number
  totalBrands?: number
  totalCategories?: number
  totalCollections?: number
  totalOrders?: number
  totalCustomers?: number
  lowStockCount?: number
  outOfStockCount?: number
  recentOrders?: RecentOrder[]
  recentProducts?: RecentProduct[]
}

interface StatTileProps {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  tone?: 'default' | 'warning' | 'danger'
}

function StatTile({ label, value, icon: Icon, tone = 'default' }: StatTileProps) {
  return (
    <Card className="rounded-xl border-border bg-card p-5">
      <CardContent className="flex items-center gap-3 p-0">
        <div
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
            tone === 'danger' ? 'bg-danger/10 text-danger' : tone === 'warning' ? 'bg-amber-500/10 text-amber-600' : 'bg-surface text-foreground'
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <div className="font-display text-2xl font-medium tracking-tight">{value}</div>
          <div className="truncate text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardClient() {
  const [data, setData] = React.useState<DashboardPayload | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return null

  const recentOrders = data.recentOrders ?? []
  const recentProducts = data.recentProducts ?? []

  const tiles: StatTileProps[] = [
    { label: 'Total Products', value: data.totalProducts ?? 0, icon: Package, tone: 'default' },
    { label: 'Total Brands', value: data.totalBrands ?? 0, icon: Tag, tone: 'default' },
    { label: 'Total Categories', value: data.totalCategories ?? 0, icon: LayoutGrid, tone: 'default' },
    { label: 'Total Collections', value: data.totalCollections ?? 0, icon: Sparkles, tone: 'default' },
    { label: 'Total Orders', value: data.totalOrders ?? 0, icon: ShoppingCart, tone: 'default' },
    { label: 'Total Customers', value: data.totalCustomers ?? 0, icon: Users, tone: 'default' },
    { label: 'Low Stock', value: data.lowStockCount ?? 0, icon: AlertTriangle, tone: 'warning' },
    { label: 'Out of Stock', value: data.outOfStockCount ?? 0, icon: XCircle, tone: 'danger' },
  ]

  const showTiles = tiles.length > 0

  return (
    <div className="space-y-6">
      {showTiles && (
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            All-time overview
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((t) => (
              <StatTile key={t.label} {...t} />
            ))}
          </div>
        </div>
      )}

      {(data.recentOrders !== undefined || data.recentProducts !== undefined) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {data.recentOrders !== undefined && (
            <Card className="rounded-xl border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display text-xl font-medium tracking-tight">Recent Orders</CardTitle>
                  <CardDescription className="mt-1">Latest 5 orders</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/orders">
                    View all
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className={recentOrders.length === 0 ? undefined : 'p-0'}>
                {recentOrders.length === 0 ? (
                  <EmptyState title="No orders yet." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="pr-6 text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="pl-6 font-mono text-xs font-medium">{order.number}</TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{order.customerName}</div>
                            <div className="text-xs text-muted-foreground">{order.email}</div>
                          </TableCell>
                          <TableCell>
                            <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', STATUS_CLASSES[order.status])}>
                              {STATUS_LABELS[order.status]}
                            </span>
                          </TableCell>
                          <TableCell className="pr-6 text-right font-medium">{formatPrice(order.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {data.recentProducts !== undefined && (
            <Card className="rounded-xl border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display text-xl font-medium tracking-tight">Recent Products</CardTitle>
                  <CardDescription className="mt-1">Latest 5 added</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/products">
                    View all
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {recentProducts.length === 0 ? (
                  <EmptyState title="No products yet." />
                ) : (
                  recentProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/admin/products`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface"
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                        <Image src={p.image} alt={p.name} fill sizes="36px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{p.brand}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
