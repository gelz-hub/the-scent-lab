'use client'

import * as React from 'react'
import { useSession } from '@/components/providers/session-provider'
import { toast } from 'sonner'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requestPushToken } from '@/lib/firebase/client'
import { isFirebaseConfigured } from '@/lib/firebase/config'

const DISMISS_KEY = 'push-onboarding-dismissed-until'
const DISMISS_DAYS = 7

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true
  const until = window.localStorage.getItem(DISMISS_KEY)
  return !!until && Date.now() < Number(until)
}

function dismissFor(days: number) {
  window.localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000))
}

/**
 * Login-triggered discoverability nudge for Web Push — solves "most users
 * never find Account > Settings to enable notifications." Reuses
 * requestPushToken()/`/api/notifications/token` exactly as-is (see
 * push-preferences.tsx, the permanent settings-page equivalent of this same
 * flow) — this component adds no new registration logic, only a prompt.
 */
export function PushOnboardingBanner() {
  const { data: session, status } = useSession()
  const [visible, setVisible] = React.useState(false)
  const [enabling, setEnabling] = React.useState(false)

  React.useEffect(() => {
    if (status !== 'authenticated' || !session) return
    if (!isFirebaseConfigured) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'default') return
    if (isDismissed()) return

    let cancelled = false
    fetch('/api/notifications/token')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        if (!data.hasToken) setVisible(true)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [status, session])

  async function handleEnable() {
    setEnabling(true)
    try {
      const token = await requestPushToken()
      if (!token) {
        // Denied, or permission dialog was dismissed without a choice —
        // no error shown per spec, just close the banner.
        setVisible(false)
        return
      }
      await fetch('/api/notifications/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'register' }),
      })
      toast.success('Notifications enabled.')
      setVisible(false)
    } finally {
      setEnabling(false)
    }
  }

  function handleDismiss() {
    dismissFor(DISMISS_DAYS)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-4 shadow-lg sm:right-4 sm:left-auto">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
          <Bell className="h-4 w-4" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Stay updated on your orders</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Receive browser notifications for:
          </p>
          <ul className="mt-1 space-y-0.5 text-xs leading-relaxed text-muted-foreground">
            <li>• Payment confirmation</li>
            <li>• Invoice generated</li>
            <li>• Order preparation</li>
            <li>• Shipment updates</li>
            <li>• Delivery confirmation</li>
          </ul>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleEnable}
              disabled={enabling}
              className="bg-foreground text-background hover:bg-brand hover:text-brand-foreground"
            >
              {enabling ? 'Enabling…' : 'Enable Notifications'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleDismiss}>
              Not Now
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
