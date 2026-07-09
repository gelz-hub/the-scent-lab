'use client'

import * as React from 'react'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CAMBODIA_PROVINCES, districtsFor } from '@/lib/checkout/constants'
import type { AddressForm } from '@/lib/checkout/use-address-form'
import type { AddressFormValues } from '@/lib/checkout/schema'
import { AddressSearch } from '@/components/maps/AddressSearch'
import { CurrentLocationButton } from '@/components/maps/CurrentLocationButton'
import { MapPicker } from '@/components/maps/MapPicker'
import { MapError } from '@/components/maps/MapError'
import { AddressPreviewCard } from './address-preview-card'
import { useReverseGeocode } from '@/hooks/maps/use-reverse-geocode'
import { useCurrentLocation } from '@/hooks/maps/use-current-location'
import type { ResolvedAddress, AddressSuggestion } from '@/lib/maps/types'

interface ShippingAddressFormProps {
  form: AddressForm
}

export function ShippingAddressForm({ form }: ShippingAddressFormProps) {
  const { register, watch, setValue, trigger, formState: { errors } } = form
  const values = watch()

  const { error: reverseError, resolve } = useReverseGeocode()
  const { requestLocation, locating } = useCurrentLocation()

  // If geocoding resolved a district spelling that isn't in our dataset, keep it
  // selectable rather than letting it silently vanish from the dropdown.
  const districtOptions = React.useMemo(() => {
    const base = values.province ? districtsFor(values.province) : []
    if (values.district && base.length > 0 && !base.includes(values.district)) {
      return [values.district, ...base]
    }
    return base
  }, [values.province, values.district])

  async function applyResolvedAddress(resolved: ResolvedAddress | AddressSuggestion) {
    if (resolved.province && (CAMBODIA_PROVINCES as readonly string[]).includes(resolved.province)) {
      setValue('province', resolved.province as AddressFormValues['province'], { shouldValidate: true })
    }
    if (resolved.district) setValue('district', resolved.district, { shouldValidate: true })
    if ('commune' in resolved && resolved.commune) setValue('commune', resolved.commune)
    if ('village' in resolved && resolved.village) setValue('village', resolved.village)
    if (resolved.streetAddress) setValue('streetAddress', resolved.streetAddress, { shouldValidate: true })
    if ('postalCode' in resolved && resolved.postalCode) setValue('postalCode', resolved.postalCode)
    setValue('latitude', resolved.latitude)
    setValue('longitude', resolved.longitude)
    await trigger()
  }

  async function handleMapChange(lat: number, lng: number) {
    setValue('latitude', lat)
    setValue('longitude', lng)
    const address = await resolve(lat, lng)
    if (address) await applyResolvedAddress(address)
    // On failure, the pin position (and existing fields) are kept — resolve() already surfaces a friendly error.
  }

  async function handleRecenter() {
    const address = await requestLocation()
    if (address) await applyResolvedAddress(address)
  }

  const hasPreview = !!(values.streetAddress && values.district && values.province)

  return (
    <div className="space-y-5">
      {/* Address search */}
      <AddressSearch onSelect={applyResolvedAddress} />

      {/* Use current location */}
      <div className="rounded-lg border border-dashed border-border p-4">
        <CurrentLocationButton onResolved={applyResolvedAddress} className="w-full sm:w-auto" />
        <p className="mt-2 text-[11px] text-muted-foreground">
          We'll fill your address automatically. You can adjust the pin or edit any field after.
        </p>
      </div>

      {/* Map — only mounted once this step is shown */}
      <div>
        <Label className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> Click or drag the pin to fine-tune your location
        </Label>
        <MapPicker
          latitude={values.latitude ?? null}
          longitude={values.longitude ?? null}
          onChange={handleMapChange}
          onRecenter={handleRecenter}
          locating={locating}
          className="min-h-80 w-full overflow-hidden rounded-lg border border-border lg:min-h-100"
        />
        {reverseError && <MapError message={reverseError} className="mt-2" />}
      </div>

      {hasPreview && (
        <AddressPreviewCard
          houseNumber={values.houseNumber}
          streetAddress={values.streetAddress}
          district={values.district}
          province={values.province}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Province</Label>
          <Select
            value={values.province}
            onValueChange={(v) => {
              setValue('province', v as AddressFormValues['province'], { shouldValidate: true })
              // District options change with province — clear any selection that no longer applies.
              if (values.district && !districtsFor(v).includes(values.district)) {
                setValue('district', '')
              }
            }}
          >
            <SelectTrigger aria-invalid={!!errors.province}>
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {CAMBODIA_PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.province && <p role="alert" className="mt-1 text-xs text-danger">{errors.province.message}</p>}
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">District / City</Label>
          {districtOptions.length > 0 ? (
            <Select
              value={values.district}
              onValueChange={(v) => setValue('district', v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.district}>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {districtOptions.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="district"
              {...register('district')}
              placeholder={values.province ? 'Enter district / city' : 'Select a province first'}
              aria-invalid={!!errors.district}
            />
          )}
          {errors.district && <p role="alert" className="mt-1 text-xs text-danger">{errors.district.message}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="commune" className="mb-1.5 block text-xs text-muted-foreground">
            Commune / Sangkat
          </Label>
          <Input id="commune" {...register('commune')} placeholder="Tonle Bassac" />
        </div>
        <div>
          <Label htmlFor="village" className="mb-1.5 block text-xs text-muted-foreground">
            Village
          </Label>
          <Input id="village" {...register('village')} placeholder="Optional" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <div>
          <Label htmlFor="houseNumber" className="mb-1.5 block text-xs text-muted-foreground">
            House No.
          </Label>
          <Input id="houseNumber" {...register('houseNumber')} placeholder="Optional" />
        </div>
        <div>
          <Label htmlFor="streetAddress" className="mb-1.5 block text-xs text-muted-foreground">
            Street address
          </Label>
          <Input
            id="streetAddress"
            {...register('streetAddress')}
            placeholder="e.g. Street 360"
            aria-invalid={!!errors.streetAddress}
          />
          {errors.streetAddress && (
            <p role="alert" className="mt-1 text-xs text-danger">{errors.streetAddress.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="deliveryNote" className="mb-1.5 block text-xs text-muted-foreground">
          Delivery notes (optional)
        </Label>
        <Textarea
          id="deliveryNote"
          rows={3}
          {...register('deliveryNote')}
          placeholder={'e.g. Near AEON Mall, blue gate.\nPlease call before delivery. Leave with security guard.'}
        />
      </div>
    </div>
  )
}
