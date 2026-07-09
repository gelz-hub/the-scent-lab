'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface StoreInformation {
  name: string
  email: string
  phone: string
  address: string
}

interface ShippingFees {
  localCourier: number
  logistics: number
}

interface Settings {
  shippingFees: ShippingFees
  lowStockThreshold: number
  invoicePrefix: string
  paymentTimeoutMinutes: number
  storeInformation: StoreInformation
}

export function SettingsClient() {
  const [settings, setSettings] = React.useState<Settings | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not load settings')
        return
      }
      setSettings(data.settings)
    } catch {
      toast.error('Could not load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  async function save(key: string, value: unknown) {
    setSaving(key)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not save setting.')
        return
      }
      toast.success('Setting saved')
    } catch {
      toast.error('Could not save setting.')
    } finally {
      setSaving(null)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Store-wide configuration — changes apply immediately and are recorded in the audit log.</p>
      </div>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg font-medium tracking-tight">Store information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(['name', 'email', 'phone', 'address'] as const).map((field) => (
            <div key={field}>
              <Label className="capitalize">{field}</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  defaultValue={settings.storeInformation[field]}
                  onBlur={(e) => save('storeInformation', { ...settings.storeInformation, [field]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg font-medium tracking-tight">Shipping fees (USD)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Local courier</Label>
            <Input
              type="number"
              defaultValue={settings.shippingFees.localCourier}
              className="mt-1.5"
              onBlur={(e) => save('shippingFees', { ...settings.shippingFees, localCourier: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Logistics (province)</Label>
            <Input
              type="number"
              defaultValue={settings.shippingFees.logistics}
              className="mt-1.5"
              onBlur={(e) => save('shippingFees', { ...settings.shippingFees, logistics: Number(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg font-medium tracking-tight">Operations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Low stock threshold</Label>
            <Input
              type="number"
              defaultValue={settings.lowStockThreshold}
              className="mt-1.5"
              onBlur={(e) => save('lowStockThreshold', Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Invoice prefix</Label>
            <Input
              defaultValue={settings.invoicePrefix}
              className="mt-1.5"
              onBlur={(e) => save('invoicePrefix', e.target.value)}
            />
          </div>
          <div>
            <Label>Payment timeout (minutes)</Label>
            <Input
              type="number"
              defaultValue={settings.paymentTimeoutMinutes}
              className="mt-1.5"
              onBlur={(e) => save('paymentTimeoutMinutes', Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {saving && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Save className="h-3.5 w-3.5 animate-pulse" strokeWidth={1.5} />
          Saving {saving}…
        </p>
      )}
    </div>
  )
}
