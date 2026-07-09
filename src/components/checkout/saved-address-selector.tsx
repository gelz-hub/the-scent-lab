'use client'

import * as React from 'react'
import { MapPin, Loader2, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AddressForm } from '@/lib/checkout/use-address-form'

interface SavedAddress {
  id: string
  label: string
  recipientName: string
  phone: string
  email: string | null
  province: string
  district: string
  commune: string | null
  village: string | null
  houseNumber: string | null
  streetAddress: string
  deliveryType: 'HOME' | 'OTHER_LOCATION'
  deliveryCompany: 'JT_EXPRESS' | 'VIREAK_BUNTHAM' | null
  deliveryNote: string | null
  isDefault: boolean
}

/**
 * Additive to the existing checkout address step — never changes what
 * happens on submit (still the same addressSchema-validated form, still
 * snapshotted into a fresh OrderAddress). Picking a saved address just
 * prefills the existing form fields via form.setValue; "Enter a new
 * address" clears back to a blank form. See src/lib/account/README.md,
 * "Saved Addresses".
 */
export function SavedAddressSelector({ form }: { form: AddressForm }) {
  const [addresses, setAddresses] = React.useState<SavedAddress[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/addresses')
      .then((res) => (res.ok ? res.json() : { addresses: [] }))
      .then((data: { addresses: SavedAddress[] }) => {
        setAddresses(data.addresses ?? [])
        const def = data.addresses?.find((a) => a.isDefault)
        if (def) applyAddress(def)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyAddress(a: SavedAddress) {
    setSelectedId(a.id)
    form.setValue('recipientName', a.recipientName, { shouldValidate: true })
    form.setValue('phone', a.phone, { shouldValidate: true })
    if (a.email) form.setValue('email', a.email)
    form.setValue('province', a.province, { shouldValidate: true })
    form.setValue('district', a.district, { shouldValidate: true })
    if (a.commune) form.setValue('commune', a.commune)
    if (a.village) form.setValue('village', a.village)
    if (a.houseNumber) form.setValue('houseNumber', a.houseNumber)
    form.setValue('streetAddress', a.streetAddress, { shouldValidate: true })
    form.setValue('deliveryType', a.deliveryType)
    if (a.deliveryCompany) form.setValue('deliveryCompany', a.deliveryCompany)
    if (a.deliveryNote) form.setValue('deliveryNote', a.deliveryNote)
  }

  function useNewAddress() {
    setSelectedId(null)
    form.reset({ deliveryType: 'HOME' })
  }

  if (loading) {
    return (
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        Checking for saved addresses…
      </div>
    )
  }

  if (addresses.length === 0) return null

  return (
    <div className="mb-5 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Use a saved address</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {addresses.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => applyAddress(a)}
            className={cn(
              'flex items-start gap-2 rounded-lg border p-3 text-left text-sm transition-colors',
              selectedId === a.id ? 'border-brand bg-brand/5' : 'border-border hover:border-foreground/40'
            )}
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <span className="min-w-0">
              <span className="block font-medium">{a.label}{a.isDefault ? ' (Default)' : ''}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {a.streetAddress}, {a.district}, {a.province}
              </span>
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={useNewAddress}
          className={cn(
            'flex items-center gap-2 rounded-lg border border-dashed p-3 text-left text-sm transition-colors',
            selectedId === null ? 'border-brand bg-brand/5' : 'border-border hover:border-foreground/40'
          )}
        >
          <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <span className="font-medium">Enter a new address</span>
        </button>
      </div>
    </div>
  )
}
