'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Package,
  Heart,
  MapPin,
  ArrowUpRight,
  ArrowRight,
  Truck,
  Bell,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatPrice } from '@/lib/format'
import { RecentlyViewed } from '@/components/sections/recently-viewed'
import { ReviewableItems } from '@/components/account/reviewable-items'

interface DashboardData {
  profile: { name: string | null; email: string } | null
  recentOrders: {
    id: string
    orderNumber: string
    status: string
    total: number
    itemCount: number
    createdAt: string
    shipmentStatus: string | null
  }[]
  activeShipments: { orderId: string; orderNumber: string; shipment: { status: string; trackingUrl: string | null } }[]
  addresses: { id: string }[]
  wishlistCount: number
  notifications: { id: string; title: string; message: string; read: boolean; createdAt: string }[]
  unreadNotificationCount: number
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  DELIVERED: 'default',
  SHIPPED: 'secondary',
  PREPARING: 'outline',
  PENDING_PAYMENT: 'outline',
  CANCELLED: 'outline',
}

export default function AccountOverviewPage() {
  const { data: session } = useSession()
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch('/api/account/dashboard')
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total orders', value: data?.recentOrders.length ?? 0, icon: Package, href: '/account/orders' },
    { label: 'Wishlist items', value: data?.wishlistCount ?? 0, icon: Heart, href: '/account/wishlist' },
    { label: 'Saved addresses', value: data?.addresses.length ?? 0, icon: MapPin, href: '/account/addresses' },
  ]

  return (
    <div className="space-y-8">
      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">Welcome back</p>
        <h2 className="mt-1.5 font-display text-3xl font-medium tracking-tight">
          {session?.user?.name || 'Your account'}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Here&apos;s a snapshot of your activity at The Scent Lab.</p>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground">
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" strokeWidth={1.5} />
            </div>
            <p className="mt-4 font-display text-3xl font-medium tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </Link>
        ))}
      </section>

      {/* Active shipments */}
      {!loading && data && data.activeShipments.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-lg font-medium">Active shipments</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.activeShipments.map((s) => (
              <div key={s.orderId} className="flex items-center gap-3 rounded-xl border border-border p-4">
                <Truck className="h-5 w-5 shrink-0 text-brand" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{s.shipment.status.replace(/_/g, ' ')}</p>
                </div>
                {s.shipment.trackingUrl && (
                  <a href={s.shipment.trackingUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand hover:underline">
                    Track
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent notifications */}
      {!loading && data && data.notifications.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-medium">Recent notifications</h3>
            <Link href="/account/notifications" className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
              View all
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="divide-y divide-border rounded-xl border border-border">
            {data.notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <p className={n.read ? 'text-sm text-muted-foreground' : 'text-sm font-medium'}>{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent orders */}
      <section>
        <Card className="rounded-xl border-border">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-display text-lg font-medium">Recent orders</h3>
            <Link href="/account/orders" className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
              View all
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
          <CardContent className="px-0 pb-0">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" strokeWidth={1.5} />
              </div>
            ) : !data || data.recentOrders.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <>
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Order</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="pr-6 text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentOrders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="pl-6 font-medium">{o.orderNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[o.status] ?? 'outline'}>{o.status.replace(/_/g, ' ')}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{o.itemCount}</TableCell>
                          <TableCell className="pr-6 text-right font-medium">{formatPrice(o.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ul className="divide-y divide-border sm:hidden">
                  {data.recentOrders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">{o.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                        <Badge variant={statusVariant[o.status] ?? 'outline'} className="mt-1.5">{o.status.replace(/_/g, ' ')}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatPrice(o.total)}</p>
                        <p className="text-xs text-muted-foreground">{o.itemCount} item{o.itemCount > 1 ? 's' : ''}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <ReviewableItems />

      {/* Recently viewed */}
      <section>
        <RecentlyViewed />
      </section>

      {/* Quick links */}
      <section>
        <h3 className="mb-3 font-display text-lg font-medium">Quick links</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Continue shopping', description: 'Browse the full collection', href: '/shop', icon: Package },
            { label: 'Your wishlist', description: `${data?.wishlistCount ?? 0} fragrance(s) saved for later`, href: '/account/wishlist', icon: Heart },
            { label: 'Manage addresses', description: 'Add or update shipping addresses', href: '/account/addresses', icon: MapPin },
            { label: 'Account settings', description: 'Update profile, password & preferences', href: '/account/settings', icon: Package },
          ].map(({ label, description, href, icon: Icon }) => (
            <Link key={label} href={href} className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground">
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="truncate text-xs text-muted-foreground">{description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" strokeWidth={1.5} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
