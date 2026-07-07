import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Package,
  Heart,
  MapPin,
  ArrowUpRight,
  ArrowRight,
  ShoppingBag,
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

export const metadata: Metadata = {
  title: 'Overview',
  description: 'Your Scent Lab account overview — recent orders, stats and quick links.',
}

const STATS = [
  { label: 'Total orders', value: '4', icon: Package, href: '/account/orders' },
  { label: 'Wishlist items', value: '6', icon: Heart, href: '/account/wishlist' },
  { label: 'Saved addresses', value: '2', icon: MapPin, href: '/account/addresses' },
] as const

const RECENT_ORDERS = [
  {
    id: 'SL-20471',
    date: 'Jul 02, 2026',
    status: 'Delivered',
    items: 2,
    total: 312,
  },
  {
    id: 'SL-20402',
    date: 'Jun 18, 2026',
    status: 'Shipped',
    items: 1,
    total: 198,
  },
  {
    id: 'SL-20338',
    date: 'May 27, 2026',
    status: 'Processing',
    items: 3,
    total: 526,
  },
] as const

const QUICK_LINKS = [
  {
    label: 'Track an order',
    description: 'See live status and delivery ETA',
    href: '/account/orders',
    icon: Package,
  },
  {
    label: 'Your wishlist',
    description: '6 fragrances saved for later',
    href: '/account/wishlist',
    icon: Heart,
  },
  {
    label: 'Manage addresses',
    description: 'Add or update shipping addresses',
    href: '/account/addresses',
    icon: MapPin,
  },
  {
    label: 'Account settings',
    description: 'Update profile, password & preferences',
    href: '/account/settings',
    icon: ShoppingBag,
  },
] as const

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  Delivered: 'default',
  Shipped: 'secondary',
  Processing: 'outline',
}

export default function AccountOverviewPage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          Welcome back
        </p>
        <h2 className="mt-1.5 font-display text-3xl font-medium tracking-tight">
          Guest User
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Here&apos;s a snapshot of your activity at The Scent Lab.
        </p>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        {STATS.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground">
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <ArrowUpRight
                className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                strokeWidth={1.5}
              />
            </div>
            <p className="mt-4 font-display text-3xl font-medium tracking-tight">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </Link>
        ))}
      </section>

      {/* Recent orders */}
      <section>
        <Card className="rounded-xl border-border">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-display text-lg font-medium">Recent orders</h3>
            <Link
              href="/account/orders"
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
          <CardContent className="px-0 pb-0">
            {/* Desktop table */}
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
                  {RECENT_ORDERS.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="pl-6 font-medium">#{o.id}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {o.date}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[o.status]}>
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {o.items}
                      </TableCell>
                      <TableCell className="pr-6 text-right font-medium">
                        {formatPrice(o.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y divide-border sm:hidden">
              {RECENT_ORDERS.map((o) => (
                <li key={o.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium">#{o.id}</p>
                    <p className="text-xs text-muted-foreground">{o.date}</p>
                    <Badge variant={statusVariant[o.status]} className="mt-1.5">
                      {o.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatPrice(o.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.items} item{o.items > 1 ? 's' : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Quick links */}
      <section>
        <h3 className="mb-3 font-display text-lg font-medium">Quick links</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK_LINKS.map(({ label, description, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground">
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {description}
                </p>
              </div>
              <ArrowRight
                className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                strokeWidth={1.5}
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
