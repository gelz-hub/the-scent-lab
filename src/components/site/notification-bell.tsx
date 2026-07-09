'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Bell, CheckCheck, FileText, CreditCard, Package, Truck, Info } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface AccountNotification {
  id: string
  type: 'PAYMENT_CONFIRMED' | 'INVOICE_GENERATED' | 'ORDER_PREPARING' | 'SHIPMENT_UPDATE' | 'GENERIC'
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

const TYPE_ICON: Record<AccountNotification['type'], React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  PAYMENT_CONFIRMED: CreditCard,
  INVOICE_GENERATED: FileText,
  ORDER_PREPARING: Package,
  SHIPMENT_UPDATE: Truck,
  GENERIC: Info,
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

export function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = React.useState<AccountNotification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [open, setOpen] = React.useState(false)

  const load = React.useCallback(async () => {
    const res = await fetch('/api/notification-center')
    if (!res.ok) return
    const data = await res.json()
    setNotifications(data.notifications ?? [])
    setUnreadCount(data.unreadCount ?? 0)
  }, [])

  React.useEffect(() => {
    if (!session) return
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [session, load])

  async function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && unreadCount > 0) {
      await fetch('/api/notification-center', { method: 'PATCH' })
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  if (!session) return null

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-full text-foreground transition-colors hover:bg-surface"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount === 0 && notifications.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckCheck className="h-3 w-3" /> All caught up
            </span>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((n) => {
              const Icon = TYPE_ICON[n.type]
              const content = (
                <div
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface',
                    !n.read && 'bg-brand/5'
                  )}
                >
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-brand">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium leading-snug">{n.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{n.message}</span>
                    <span className="mt-1 block text-[10px] text-muted-foreground/70">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                </div>
              )
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => setOpen(false)} className="block border-b border-border last:border-0">
                  {content}
                </Link>
              ) : (
                <div key={n.id} className="border-b border-border last:border-0">
                  {content}
                </div>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
