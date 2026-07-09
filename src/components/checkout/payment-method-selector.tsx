'use client'

import { QrCode, CreditCard, Banknote, Landmark, ShieldCheck } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { PAYMENT_METHODS, type PaymentMethodValue } from '@/lib/checkout/constants'

const ICONS: Record<PaymentMethodValue, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  ABA_KHQR: QrCode,
  ABA_PAYWAY: ShieldCheck,
  CREDIT_CARD: CreditCard,
  COD: Banknote,
  BANK_TRANSFER: Landmark,
}

interface PaymentMethodSelectorProps {
  value: PaymentMethodValue | undefined
  onChange: (value: PaymentMethodValue) => void
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as PaymentMethodValue)} className="grid-cols-1 gap-3">
      {PAYMENT_METHODS.map((method) => {
        const Icon = ICONS[method.value]
        const selected = value === method.value
        return (
          <label
            key={method.value}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3.5 text-sm transition-colors',
              method.enabled
                ? 'cursor-pointer hover:border-foreground/30'
                : 'cursor-not-allowed opacity-50',
              selected && 'border-foreground bg-surface'
            )}
          >
            <RadioGroupItem value={method.value} disabled={!method.enabled} />
            <Icon className="h-4 w-4 text-brand" strokeWidth={1.5} />
            <span className="flex-1">
              <span className="block font-medium">{method.label}</span>
              <span className="block text-xs text-muted-foreground">{method.description}</span>
            </span>
          </label>
        )
      })}
    </RadioGroup>
  )
}
