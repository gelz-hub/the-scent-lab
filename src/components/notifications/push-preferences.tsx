'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { requestPushToken } from '@/lib/firebase/client'
import { isFirebaseConfigured } from '@/lib/firebase/config'

interface Preferences {
  orderUpdates: boolean
  backInStock: boolean
  priceDrops: boolean
  promotions: boolean
  newArrivals: boolean
}

const CATEGORIES: { key: keyof Preferences; label: string; hint: string }[] = [
  { key: 'orderUpdates', label: 'Order updates', hint: 'Shipping and delivery status changes' },
  { key: 'backInStock', label: 'Back in stock', hint: 'Wishlist items become available again' },
  { key: 'priceDrops', label: 'Price drops', hint: 'Wishlist items go on sale' },
  { key: 'newArrivals', label: 'New arrivals', hint: 'Fresh drops from your favourite houses' },
  { key: 'promotions', label: 'Promotions', hint: 'Seasonal offers and campaigns' },
]

export function PushPreferences() {
  const [permission, setPermission] = React.useState<NotificationPermission | 'unsupported'>('default')
  const [enabling, setEnabling] = React.useState(false)
  const [prefs, setPrefs] = React.useState<Preferences | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)
  }, [])

  React.useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setPrefs(data.preferences))
      .catch(() => {})
  }, [])

  async function handleEnable() {
    if (!isFirebaseConfigured) {
      toast.error('Push notifications are not configured yet.')
      return
    }
    setEnabling(true)
    try {
      const token = await requestPushToken()
      if (!token) {
        setPermission(typeof window !== 'undefined' ? Notification.permission : 'denied')
        toast.error('Notification permission was not granted.')
        return
      }
      await fetch('/api/notifications/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'register' }),
      })
      setPermission('granted')
      toast.success('Push notifications enabled')
    } finally {
      setEnabling(false)
    }
  }

  async function updatePref(key: keyof Preferences, value: boolean) {
    setPrefs((prev) => (prev ? { ...prev, [key]: value } : prev))
    await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => {
      toast.error('Could not save preference')
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight">Push notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Get notified in your browser for the things you care about.
          </p>
        </div>
        {permission === 'granted' ? (
          <Bell className="h-5 w-5 shrink-0 text-brand" strokeWidth={1.5} />
        ) : (
          <BellOff className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        )}
      </div>

      {permission === 'unsupported' ? (
        <p className="mt-4 text-sm text-muted-foreground">Not supported in this browser.</p>
      ) : permission === 'granted' ? (
        <div className="mt-5 space-y-4">
          {CATEGORIES.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor={`pref-${key}`} className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <Switch
                id={`pref-${key}`}
                checked={prefs?.[key] ?? true}
                onCheckedChange={(v) => updatePref(key, v)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <Button
            type="button"
            onClick={handleEnable}
            disabled={enabling || permission === 'denied'}
            className="bg-foreground text-background hover:bg-brand hover:text-brand-foreground"
          >
            {enabling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enabling…
              </>
            ) : (
              'Enable push notifications'
            )}
          </Button>
          {permission === 'denied' && (
            <p className="mt-2 text-xs text-muted-foreground">
              Notifications are blocked for this site in your browser settings.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
