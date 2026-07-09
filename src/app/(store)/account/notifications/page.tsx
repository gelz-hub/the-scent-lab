'use client'

import * as React from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CheckCheck, FileText, CreditCard, Package, Truck, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type NotificationType = 'PAYMENT_CONFIRMED' | 'INVOICE_GENERATED' | 'ORDER_PREPARING' | 'SHIPMENT_UPDATE' | 'GENERIC'

interface AccountNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

const TYPE_ICON: Record<NotificationType, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  PAYMENT_CONFIRMED: CreditCard,
  INVOICE_GENERATED: FileText,
  ORDER_PREPARING: Package,
  SHIPMENT_UPDATE: Truck,
  GENERIC: Info,
}

// Spec groups notifications by "Order / Payment / Shipment / Invoice /
// Promotion (future)" — mapped onto the existing NotificationType enum
// (see src/lib/notification-center/service.ts) rather than introducing a
// second, parallel category system.
const FILTERS: { key: 'ALL' | 'UNREAD' | 'ORDER' | 'PAYMENT' | 'SHIPMENT' | 'INVOICE'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'UNREAD', label: 'Unread' },
  { key: 'ORDER', label: 'Order' },
  { key: 'PAYMENT', label: 'Payment' },
  { key: 'SHIPMENT', label: 'Shipment' },
  { key: 'INVOICE', label: 'Invoice' },
]

const TYPE_TO_FILTER: Record<NotificationType, string> = {
  PAYMENT_CONFIRMED: 'PAYMENT',
  INVOICE_GENERATED: 'INVOICE',
  ORDER_PREPARING: 'ORDER',
  SHIPMENT_UPDATE: 'SHIPMENT',
  GENERIC: 'ALL',
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<AccountNotification[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]['key']>('ALL')

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notification-center')
      const data = await res.json()
      setNotifications(data.notifications ?? [])
    } catch {
      toast.error('Could not load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  async function handleMarkAllRead() {
    await fetch('/api/notification-center', { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'ALL') return true
    if (filter === 'UNREAD') return !n.read
    return TYPE_TO_FILTER[n.type] === filter
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.key ? 'border-brand bg-brand text-brand-foreground' : 'border-border hover:border-foreground/40'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <p className="text-sm">No notifications here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {filtered.map((n) => {
            const Icon = TYPE_ICON[n.type]
            const content = (
              <div className={cn('flex items-start gap-3 px-4 py-4 transition-colors hover:bg-surface', !n.read && 'bg-brand/5')}>
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-brand">
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm', !n.read && 'font-medium')}>{n.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{n.message}</span>
                  <span className="mt-1 block text-xs text-muted-foreground/70">{timeAgo(n.createdAt)}</span>
                </span>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
              </div>
            )
            return n.link ? (
              <Link key={n.id} href={n.link} className="block">
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
