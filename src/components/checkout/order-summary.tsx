'use client'

import Image from 'next/image'
import { Truck } from 'lucide-react'
import type { CartLine } from '@/lib/store'
import { formatPrice, formatKHR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CouponInput } from './coupon-input'

interface OrderSummaryProps {
  cart: CartLine[]
  subtotal: number
  discount: number
  shippingFee: number | null
  total: number
  estimatedDelivery: string | null
  showCoupon?: boolean
  className?: string
}

export function OrderSummary({
  cart,
  subtotal,
  discount,
  shippingFee,
  total,
  estimatedDelivery,
  showCoupon = true,
  className,
}: OrderSummaryProps) {
  return (
    <div className={cn('rounded-xl border border-border p-6', className)}>
      <h2 className="font-display text-xl font-medium">Order summary</h2>

      <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
        {cart.map((line) => (
          <div key={`${line.productId}-${line.volume.ml}`} className="flex items-center gap-3">
            <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-surface">
              <Image src={line.image} alt={line.name} fill sizes="40px" className="object-contain p-1" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-medium">{line.name}</p>
              <p className="text-[11px] text-muted-foreground">{line.volume.ml}ml · {line.qty}×</p>
            </div>
            <span className="text-right">
              <span className="block text-xs font-semibold">{formatPrice(line.volume.price * line.qty)}</span>
              <span className="block text-[10px] text-muted-foreground">{formatKHR(line.volume.price * line.qty)}</span>
            </span>
          </div>
        ))}
      </div>

      {showCoupon && (
        <div className="mt-4 border-t border-border pt-4">
          <CouponInput />
        </div>
      )}

      <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
        <Row label="Subtotal" value={formatPrice(subtotal)} />
        {discount > 0 && <Row label="Discount" value={`−${formatPrice(discount)}`} accent="success" />}
        <Row
          label="Shipping"
          value={shippingFee == null ? 'Calculated at next step' : formatPrice(shippingFee)}
        />
        <div className="my-2 border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="font-medium">Total</span>
          <span className="text-right">
            <span className="block font-display text-2xl font-semibold">{formatPrice(total)}</span>
            <span className="block text-xs text-muted-foreground">{formatKHR(total)}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Truck className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} />
        {estimatedDelivery ?? 'Enter your address to see delivery estimate'}
      </div>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: 'success' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', accent === 'success' && 'text-success')}>{value}</span>
    </div>
  )
}
