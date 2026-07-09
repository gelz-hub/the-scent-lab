'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AddressForm } from '@/lib/checkout/use-address-form'

export function ContactForm({ form }: { form: AddressForm }) {
  const { register, formState: { errors } } = form

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="recipientName" className="mb-1.5 block text-xs text-muted-foreground">
          Recipient name
        </Label>
        <Input
          id="recipientName"
          {...register('recipientName')}
          placeholder="Sok Dara"
          aria-invalid={!!errors.recipientName}
          aria-describedby={errors.recipientName ? 'recipientName-error' : undefined}
        />
        {errors.recipientName && (
          <p id="recipientName-error" role="alert" className="mt-1 text-xs text-danger">
            {errors.recipientName.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="phone" className="mb-1.5 block text-xs text-muted-foreground">
          Phone number
        </Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="012 345 678"
          inputMode="tel"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <p id="phone-error" role="alert" className="mt-1 text-xs text-danger">
            {errors.phone.message}
          </p>
        )}
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="email" className="mb-1.5 block text-xs text-muted-foreground">
          Email (optional)
        </Label>
        <Input id="email" type="email" {...register('email')} placeholder="you@example.com" />
        {errors.email && (
          <p role="alert" className="mt-1 text-xs text-danger">{errors.email.message}</p>
        )}
      </div>
    </div>
  )
}
