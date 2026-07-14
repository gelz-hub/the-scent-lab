'use client'

import { Truck } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { DELIVERY_TYPES, LOGISTICS_COMPANIES, PREFERRED_DELIVERY_TIMES } from '@/lib/checkout/constants'
import { isLocalCourier, estimatedDeliveryFor, shippingFeeFor } from '@/lib/checkout/delivery'
import { formatPrice } from '@/lib/format'
import type { AddressForm } from '@/lib/checkout/use-address-form'
import type { AddressFormValues } from '@/lib/checkout/schema'

interface DeliverySelectorProps {
  form: AddressForm
  subtotal?: number
  freeShipping?: boolean
}

export function DeliverySelector({ form, subtotal = 0, freeShipping = false }: DeliverySelectorProps) {
  const { watch, setValue, formState: { errors } } = form
  const values = watch()

  const localCourier = values.province ? isLocalCourier(values.province) : false
  const estimate = values.province ? estimatedDeliveryFor(values.province) : null
  const fee = values.province ? shippingFeeFor(values.province, subtotal, { freeShipping }) : null

  return (
    <div className="space-y-6">
      {/* Delivery type */}
      <div>
        <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Delivery type
        </Label>
        <RadioGroup
          value={values.deliveryType}
          onValueChange={(v) => setValue('deliveryType', v as AddressFormValues['deliveryType'])}
          className="grid-cols-1 sm:grid-cols-2"
        >
          {DELIVERY_TYPES.map((t) => (
            <label
              key={t.value}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 text-sm transition-colors',
                values.deliveryType === t.value ? 'border-foreground bg-surface' : 'border-border hover:border-foreground/30'
              )}
            >
              <RadioGroupItem value={t.value} />
              {t.label}
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Delivery method — Phnom Penh is automatic; provinces let the customer choose a courier */}
      <div>
        <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Delivery method
        </Label>
        {!values.province ? (
          <p className="text-sm text-muted-foreground">Select a province to see delivery options.</p>
        ) : localCourier ? (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3.5 text-sm">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={1.5} />
            <div>
              <p className="font-medium">Local Courier</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {estimate}
                {fee != null && <> · {fee === 0 ? 'Free' : formatPrice(fee)}</>}
              </p>
            </div>
          </div>
        ) : (
          <>
            <RadioGroup
              value={values.deliveryCompany}
              onValueChange={(v) => setValue('deliveryCompany', v as AddressFormValues['deliveryCompany'], { shouldValidate: true })}
              className="grid-cols-1 gap-3"
            >
              {LOGISTICS_COMPANIES.map((c) => (
                <label
                  key={c.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3.5 text-sm transition-colors',
                    values.deliveryCompany === c.id ? 'border-foreground bg-surface' : 'border-border hover:border-foreground/30'
                  )}
                >
                  <RadioGroupItem value={c.id} className="mt-0.5" />
                  <span>
                    <span className="block font-medium">{c.displayName}</span>
                    <span className="block text-xs text-muted-foreground">{c.description}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Estimated Delivery: {c.estimatedDelivery}
                      {fee != null && <> · {formatPrice(fee)}</>}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
            {errors.deliveryCompany && (
              <p role="alert" className="mt-1 text-xs text-danger">{errors.deliveryCompany.message}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Delivery times may vary slightly depending on your exact destination.
            </p>
          </>
        )}
      </div>

      {/* Preferred delivery time */}
      <div>
        <Label className="mb-1.5 block text-xs text-muted-foreground">Preferred delivery time (optional)</Label>
        <Select
          value={values.preferredDeliveryTime}
          onValueChange={(v) => setValue('preferredDeliveryTime', v as AddressFormValues['preferredDeliveryTime'])}
        >
          <SelectTrigger><SelectValue placeholder="Anytime" /></SelectTrigger>
          <SelectContent>
            {PREFERRED_DELIVERY_TIMES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
