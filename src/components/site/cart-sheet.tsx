'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Minus, Plus, Trash2, ShoppingBag, Tag, X, Check } from 'lucide-react'
import { useStore, cartSubtotal, type CartLine } from '@/lib/store'
import { formatPrice } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const FREE_SHIP_THRESHOLD = 100
const SHIP_FLAT = 9

export function CartSheet() {
  const cart = useStore((s) => s.cart)
  const open = useStore((s) => s.cartOpen)
  const setOpen = useStore((s) => s.setCartOpen)
  const updateQty = useStore((s) => s.updateQty)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const clearCart = useStore((s) => s.clearCart)
  const promo = useStore((s) => s.promo)
  const applyPromo = useStore((s) => s.applyPromo)

  const [code, setCode] = React.useState('')

  const subtotal = cartSubtotal(cart)
  const discount = promo ? subtotal * promo.discount : 0
  const afterDiscount = subtotal - discount
  const shipping =
    afterDiscount >= FREE_SHIP_THRESHOLD || afterDiscount === 0 ? 0 : SHIP_FLAT
  const total = afterDiscount + shipping
  const remainingForFreeShip = Math.max(0, FREE_SHIP_THRESHOLD - afterDiscount)

  const handleApply = () => {
    if (!code.trim()) return
    const ok = applyPromo(code)
    if (ok) {
      const pct = Math.round((useStore.getState().promo?.discount ?? 0) * 100)
      toast.success('Promo applied', {
        description: `${code.toUpperCase()} · ${pct > 0 ? `${pct}% off` : 'Free shipping'}`,
      })
      setCode('')
    } else {
      toast.error('Invalid promo code', { description: 'Try SCENT10 or WELCOME15' })
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0) return
    setOpen(false)
    window.location.href = '/checkout'
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 border-border p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 font-display text-xl">
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            Your Cart
            <span className="text-sm font-sans font-normal text-muted-foreground">
              ({cart.reduce((s, l) => s + l.qty, 0)})
            </span>
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-surface">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" strokeWidth={1.2} />
            </div>
            <p className="font-display text-lg">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">
              Discover your signature scent from our curated edit.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            <div className="border-b border-border bg-surface/60 px-5 py-3">
              {remainingForFreeShip > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add <span className="font-medium text-foreground">{formatPrice(remainingForFreeShip)}</span> for free shipping
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-success">
                  <Check className="h-3.5 w-3.5" /> You've unlocked free shipping
                </p>
              )}
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: `${Math.min(100, (afterDiscount / FREE_SHIP_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>

            {/* Lines */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {cart.map((line: CartLine) => (
                  <div key={`${line.productId}-${line.volume.ml}`} className="flex gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface">
                      <Image
                        src={line.image}
                        alt={`${line.brand} ${line.name}`}
                        fill
                        sizes="80px"
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {line.brand}
                          </p>
                          <p className="line-clamp-1 text-sm font-medium">{line.name}</p>
                          <p className="text-xs text-muted-foreground">{line.volume.ml}ml</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(line.productId, line.volume.ml)}
                          aria-label="Remove item"
                          className="text-muted-foreground transition-colors hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-md border border-border">
                          <button
                            onClick={() => updateQty(line.productId, line.volume.ml, line.qty - 1)}
                            className="grid h-7 w-7 place-items-center text-muted-foreground hover:text-foreground"
                            aria-label="Decrease"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-medium">{line.qty}</span>
                          <button
                            onClick={() => updateQty(line.productId, line.volume.ml, line.qty + 1)}
                            className="grid h-7 w-7 place-items-center text-muted-foreground hover:text-foreground"
                            aria-label="Increase"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatPrice(line.volume.price * line.qty)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo + summary */}
            <SheetFooter className="border-t border-border px-5 py-4">
              <div className="mb-3 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-border px-3">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Promo code"
                    className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={handleApply}
                  className="rounded-lg border border-border px-4 text-xs font-medium transition-colors hover:border-foreground/40"
                >
                  Apply
                </button>
              </div>

              {promo && (
                <div className="mb-3 flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-success" /> {promo.code}
                  </span>
                  <span className="font-medium text-success">
                    −{formatPrice(discount)}
                  </span>
                </div>
              )}

              <div className="space-y-1.5 text-sm">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                {discount > 0 && (
                  <Row label="Discount" value={`−${formatPrice(discount)}`} accent="success" />
                )}
                <Row
                  label="Shipping"
                  value={shipping === 0 ? 'Free' : formatPrice(shipping)}
                />
                <div className="my-2 border-t border-border" />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-display text-xl font-semibold">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-foreground py-3.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground active:scale-[0.99]"
              >
                Checkout · {formatPrice(total)}
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Taxes calculated at checkout · Secure payment
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'success'
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', accent === 'success' && 'text-success')}>
        {value}
      </span>
    </div>
  )
}
