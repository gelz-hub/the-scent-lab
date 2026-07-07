import type { Metadata } from 'next'
import Image from 'next/image'
import {
  Truck,
  RotateCcw,
  Package,
  CheckCircle2,
  Clock,
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
import { formatPrice } from '@/lib/format'
import { products } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Orders',
  description: 'View and track your Scent Lab orders.',
}

type OrderStatus = 'Delivered' | 'Shipped' | 'Processing'

interface OrderLine {
  slug: string
  name: string
  brand: string
  image: string
  qty: number
  price: number
  ml: number
}

interface Order {
  id: string
  date: string
  status: OrderStatus
  eta?: string
  items: OrderLine[]
}

const orderTotal = (o: Order) =>
  o.items.reduce((sum, i) => sum + i.price * i.qty, 0)

const p = (slug: string) => products.find((pr) => pr.slug === slug)!

const ORDERS: Order[] = [
  {
    id: 'SL-20471',
    date: 'Jul 02, 2026',
    status: 'Delivered',
    items: [
      {
        slug: 'le-labo-santal-33',
        name: p('le-labo-santal-33').name,
        brand: p('le-labo-santal-33').brand,
        image: p('le-labo-santal-33').image,
        qty: 1,
        price: p('le-labo-santal-33').volumes[0].price,
        ml: p('le-labo-santal-33').volumes[0].ml,
      },
      {
        slug: 'dior-sauvage-eau-de-toilette',
        name: p('dior-sauvage-eau-de-toilette').name,
        brand: p('dior-sauvage-eau-de-toilette').brand,
        image: p('dior-sauvage-eau-de-toilette').image,
        qty: 1,
        price: p('dior-sauvage-eau-de-toilette').volumes[0].price,
        ml: p('dior-sauvage-eau-de-toilette').volumes[0].ml,
      },
    ],
  },
  {
    id: 'SL-20402',
    date: 'Jun 18, 2026',
    status: 'Shipped',
    eta: 'Arrives Jul 09',
    items: [
      {
        slug: 'tom-ford-tobacco-vanille',
        name: p('tom-ford-tobacco-vanille').name,
        brand: p('tom-ford-tobacco-vanille').brand,
        image: p('tom-ford-tobacco-vanille').image,
        qty: 1,
        price: p('tom-ford-tobacco-vanille').volumes[0].price,
        ml: p('tom-ford-tobacco-vanille').volumes[0].ml,
      },
    ],
  },
  {
    id: 'SL-20338',
    date: 'May 27, 2026',
    status: 'Processing',
    eta: 'Ships in 1-2 days',
    items: [
      {
        slug: 'creed-aventus',
        name: p('creed-aventus').name,
        brand: p('creed-aventus').brand,
        image: p('creed-aventus').image,
        qty: 1,
        price: p('creed-aventus').volumes[0].price,
        ml: p('creed-aventus').volumes[0].ml,
      },
      {
        slug: 'chanel-no-5-eau-de-parfum',
        name: p('chanel-no-5-eau-de-parfum').name,
        brand: p('chanel-no-5-eau-de-parfum').brand,
        image: p('chanel-no-5-eau-de-parfum').image,
        qty: 1,
        price: p('chanel-no-5-eau-de-parfum').volumes[0].price,
        ml: p('chanel-no-5-eau-de-parfum').volumes[0].ml,
      },
    ],
  },
  {
    id: 'SL-20219',
    date: 'Apr 11, 2026',
    status: 'Delivered',
    items: [
      {
        slug: 'byredo-gypsy-water',
        name: p('byredo-gypsy-water').name,
        brand: p('byredo-gypsy-water').brand,
        image: p('byredo-gypsy-water').image,
        qty: 1,
        price: p('byredo-gypsy-water').volumes[0].price,
        ml: p('byredo-gypsy-water').volumes[0].ml,
      },
    ],
  },
]

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'outline'> = {
  Delivered: 'default',
  Shipped: 'secondary',
  Processing: 'outline',
}

const statusIcon: Record<OrderStatus, typeof Truck> = {
  Delivered: CheckCircle2,
  Shipped: Truck,
  Processing: Clock,
}

function OrderActions({ id }: { id: string }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 border-border text-xs hover:border-foreground/40"
      >
        <Truck className="h-3.5 w-3.5" strokeWidth={1.5} />
        Track
        <span className="sr-only">order {id}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 border-border text-xs hover:border-foreground/40"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
        Reorder
        <span className="sr-only">order {id}</span>
      </Button>
    </div>
  )
}

export default function OrdersPage() {
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
          {ORDERS.length} orders placed
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ORDERS.map((o) => {
              const StatusIcon = statusIcon[o.status]
              const itemsSummary = o.items
                .map((i) => `${i.brand} ${i.name}`)
                .join(', ')
              return (
                <TableRow key={o.id}>
                  <TableCell className="pl-6">
                    <p className="font-medium">#{o.id}</p>
                    <p
                      className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground"
                      title={itemsSummary}
                    >
                      {itemsSummary}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {o.date}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[o.status]}>
                      <StatusIcon className="h-3 w-3" strokeWidth={1.75} />
                      {o.status}
                    </Badge>
                    {o.eta && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {o.eta}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.items.reduce((n, i) => n + i.qty, 0)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(orderTotal(o))}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <OrderActions id={o.id} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-4 md:hidden">
        {ORDERS.map((o) => {
          const StatusIcon = statusIcon[o.status]
          return (
            <li
              key={o.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">#{o.id}</p>
                  <p className="text-xs text-muted-foreground">{o.date}</p>
                </div>
                <Badge variant={statusVariant[o.status]}>
                  <StatusIcon className="h-3 w-3" strokeWidth={1.75} />
                  {o.status}
                </Badge>
              </div>

              {o.eta && (
                <p className="mt-3 text-xs text-muted-foreground">{o.eta}</p>
              )}

              <ul className="mt-4 space-y-3">
                {o.items.map((item) => (
                  <li key={item.slug} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface">
                      <Image
                        src={item.image}
                        alt={`${item.brand} ${item.name}`}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {item.brand}
                      </p>
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.ml}ml · Qty {item.qty}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(item.price * item.qty)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <p className="text-sm">
                  <span className="text-muted-foreground">Total </span>
                  <span className="font-medium">{formatPrice(orderTotal(o))}</span>
                </p>
                <OrderActions id={o.id} />
              </div>
            </li>
          )
        })}
      </ul>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Package className="h-3.5 w-3.5" strokeWidth={1.5} />
        Need help with an order?{' '}
        <a
          href="/contact"
          className="text-foreground underline-offset-2 hover:underline"
        >
          Contact support
        </a>
      </p>
    </div>
  )
}
