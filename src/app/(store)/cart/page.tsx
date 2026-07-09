'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, Tag, Check, ArrowRight, X } from 'lucide-react'
import { useStore, cartSubtotal } from '@/lib/store'
import { formatPrice, formatKHR } from '@/lib/format'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { EmptyState } from '@/components/site/empty-state'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const FREE_SHIP_THRESHOLD = 100
const SHIP_FLAT = 9

export default function CartPage() {
  const cart = useStore((s) => s.cart)
  const updateQty = useStore((s) => s.updateQty)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const promo = useStore((s) => s.promo)
  const applyPromo = useStore((s) => s.applyPromo)
  const [code, setCode] = React.useState('')

  const subtotal = cartSubtotal(cart)
  const discount = promo ? subtotal * promo.discount : 0
  const afterDiscount = subtotal - discount
  const shipping = afterDiscount >= FREE_SHIP_THRESHOLD || afterDiscount === 0 ? 0 : SHIP_FLAT
  const total = afterDiscount + shipping

  const handleApply = () => {
    if (!code.trim()) return
    const ok = applyPromo(code)
    if (ok) {
      toast.success('Promo applied', { description: code.toUpperCase() })
      setCode('')
    } else {
      toast.error('Invalid promo code', { description: 'Try SCENT10 or WELCOME15' })
    }
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
        <h1 className="mb-8 font-display text-4xl font-medium tracking-tight">Your cart</h1>
        <EmptyState
          title="Your cart is empty"
          description="Discover your signature scent from our curated edit of authentic fragrances."
          actionLabel="Continue shopping"
          actionHref="/shop"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
      <h1 className="mb-8 font-display text-4xl font-medium tracking-tight">Your cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div>
          <div className="divide-y divide-border rounded-xl border border-border">
            {cart.map((line) => (
              <div key={`${line.productId}-${line.volume.ml}`} className="flex gap-4 p-4">
                <Link
                  href={`/product/${line.slug}`}
                  className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-surface"
                >
                  <Image
                    src={line.image}
                    alt={`${line.brand} ${line.name}`}
                    fill
                    sizes="96px"
                    className="object-contain p-2"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <div>
                      <Link href={`/brands/${line.slug}`} className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                        {line.brand}
                      </Link>
                      <Link
                        href={`/product/${line.slug}`}
                        className="block line-clamp-1 text-sm font-medium hover:text-brand"
                      >
                        {line.name}
                      </Link>
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
                        className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-medium">{line.qty}</span>
                      <button
                        onClick={() => updateQty(line.productId, line.volume.ml, line.qty + 1)}
                        className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground"
                        aria-label="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-right">
                      <span className="block text-sm font-semibold">
                        {formatPrice(line.volume.price * line.qty)}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {formatKHR(line.volume.price * line.qty)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/shop"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            Continue shopping
          </Link>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border p-6">
            <h2 className="font-display text-xl font-medium">Order summary</h2>

            {/* Promo */}
            <div className="mt-4 flex gap-2">
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
              <div className="mt-3 flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-success" /> {promo.code}
                </span>
                <span className="font-medium text-success">−{formatPrice(discount)}</span>
              </div>
            )}

            <div className="mt-5 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              {discount > 0 && (
                <Row label="Discount" value={`−${formatPrice(discount)}`} accent="success" />
              )}
              <Row label="Shipping" value={shipping === 0 ? 'Free' : formatPrice(shipping)} />
              <div className="my-2 border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-right">
                  <span className="block font-display text-2xl font-semibold">{formatPrice(total)}</span>
                  <span className="block text-xs text-muted-foreground">{formatKHR(total)}</span>
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-foreground py-3.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              Proceed to checkout
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Taxes calculated at checkout · Secure payment
            </p>
          </div>
        </aside>
      </div>
    </div>
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
      <span className={cn('font-medium', accent === 'success' && 'text-success')}>{value}</span>
    </div>
  )
}
