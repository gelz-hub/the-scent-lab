'use client'

import * as React from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, MapPin, Heart, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPrice } from '@/lib/format'

interface CustomerDetail {
  customer: { id: string; name: string | null; email: string; phone: string | null; dateOfBirth: string | null; createdAt: string }
  orders: {
    id: string
    orderNumber: string
    status: string
    total: number
    createdAt: string
    items: { id: string }[]
    payments: { status: string }[]
    shipment: { status: string; deliveryCompany: string | null } | null
    invoice: { invoiceNumber: string; status: string } | null
  }[]
  addresses: { id: string; label: string; province: string; district: string; isDefault: boolean }[]
  wishlistCount: number
  reviewCount: number
}

export function CustomerDetailClient({ customerId }: { customerId: string }) {
  const [data, setData] = React.useState<CustomerDetail | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch(`/api/admin/customers/${customerId}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.error) {
          toast.error(d.error)
          return
        }
        setData(d)
      })
      .catch(() => toast.error('Could not load customer'))
      .finally(() => setLoading(false))
  }, [customerId])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
      </div>
    )
  }

  if (!data) return <p className="py-20 text-center text-muted-foreground">Customer not found.</p>

  const { customer, orders, addresses, wishlistCount, reviewCount } = data
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to customers
      </Link>

      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">{customer.name || 'Unnamed customer'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{customer.email} {customer.phone ? `· ${customer.phone}` : ''}</p>
        <p className="mt-1 text-xs text-muted-foreground">Joined {new Date(customer.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Orders" value={orders.length} />
        <StatCard label="Total spent" value={formatPrice(totalSpent)} />
        <StatCard label="Wishlist items" value={wishlistCount} icon={Heart} />
        <StatCard label="Reviews written" value={reviewCount} icon={Star} />
      </div>

      {addresses.length > 0 && (
        <Card className="rounded-xl border-border bg-card">
          <CardHeader>
            <CardTitle className="font-display text-lg font-medium tracking-tight">Saved addresses</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {addresses.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <span>{a.label} — {a.district}, {a.province}</span>
                {a.isDefault && <Badge variant="outline" className="ml-auto">Default</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg font-medium tracking-tight">Order history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Shipment</TableHead>
                <TableHead className="pr-6 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No orders yet.</TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-6 font-medium">{o.orderNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{o.payments[0]?.status ?? '—'}</TableCell>
                    <TableCell>{o.shipment?.status ?? '—'}</TableCell>
                    <TableCell className="pr-6 text-right font-medium">{formatPrice(o.total)}</TableCell>
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

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="mt-2 font-display text-2xl font-medium">{value}</p>
    </div>
  )
}
