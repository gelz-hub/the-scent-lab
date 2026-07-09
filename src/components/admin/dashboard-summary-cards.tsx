'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  ShoppingCart,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  DollarSign,
  CalendarDays,
  AlertTriangle,
  Bell,
  Loader2,
} from 'lucide-react'
import { formatPrice } from '@/lib/format'

interface DashboardPayload {
  todaysOrders?: number
  pendingPayments?: number
  preparingOrders?: number
  readyToShip?: number
  outForDelivery?: number
  deliveredToday?: number
  revenueToday?: number
  revenueThisMonth?: number
  lowStockCount?: number
  unreadNotifications?: number
  recentCustomerActivity?: { id: string; name: string | null; email: string; createdAt: string }[]
}

const CARD_DEFS: { key: keyof DashboardPayload; label: string; icon: React.ComponentType<{ className?: string }>; format?: 'currency' }[] = [
  { key: 'todaysOrders', label: "Today's Orders", icon: ShoppingCart },
  { key: 'pendingPayments', label: 'Pending Payments', icon: Clock },
  { key: 'preparingOrders', label: 'Preparing Orders', icon: Package },
  { key: 'readyToShip', label: 'Ready to Ship', icon: Package },
  { key: 'outForDelivery', label: 'Out for Delivery', icon: Truck },
  { key: 'deliveredToday', label: 'Delivered Today', icon: CheckCircle2 },
  { key: 'revenueToday', label: 'Revenue Today', icon: DollarSign, format: 'currency' },
  { key: 'revenueThisMonth', label: 'Revenue This Month', icon: CalendarDays, format: 'currency' },
  { key: 'lowStockCount', label: 'Low Stock Products', icon: AlertTriangle },
  { key: 'unreadNotifications', label: 'Unread Notifications', icon: Bell },
]

/** Real-time operational summary — see GET /api/admin/dashboard. Only shows cards for modules the signed-in role can see (the API trims the payload server-side, so an absent field just isn't rendered here). */
export function DashboardSummaryCards() {
  const [data, setData] = React.useState<DashboardPayload | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then(setData)
      .catch(() => toast.error('Could not load dashboard summary'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
      </div>
    )
  }

  if (!data) return null

  const visibleCards = CARD_DEFS.filter((c) => data[c.key] !== undefined)

  return (
    <div className="space-y-6">
      {visibleCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {visibleCards.map(({ key, label, icon: Icon, format }) => {
            const value = data[key] as number
            return (
              <div key={key} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 font-display text-2xl font-medium">
                  {format === 'currency' ? formatPrice(value) : value}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {data.recentCustomerActivity && data.recentCustomerActivity.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-medium">Recent customer activity</h3>
          <ul className="mt-3 divide-y divide-border">
            {data.recentCustomerActivity.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span>{c.name || 'Unnamed'} <span className="text-muted-foreground">· {c.email}</span></span>
                <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
