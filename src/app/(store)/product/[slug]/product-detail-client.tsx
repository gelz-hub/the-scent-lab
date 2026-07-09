'use client'

import * as React from 'react'
import { Minus, Plus, ShoppingBag, Heart, Check, Truck, ShieldCheck } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatPrice, formatKHR, discountPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Product } from '@/lib/data'

function PerfBars({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn('h-1.5 w-6 rounded-full', i <= value ? 'bg-brand' : 'bg-border')}
          />
        ))}
      </div>
    </div>
  )
}

export function ProductDetailClient({ product }: { product: Product }) {
  // Track recently viewed on mount
  const addRecentlyViewed = useStore((s) => s.addRecentlyViewed)
  React.useEffect(() => {
    addRecentlyViewed(product.id)
  }, [product.id, addRecentlyViewed])

  return null
}

// Actions island — volume selector, qty, add to cart, wishlist
function Actions({ product }: { product: Product }) {
  const addToCart = useStore((s) => s.addToCart)
  const toggleWishlist = useStore((s) => s.toggleWishlist)
  const wishlisted = useStore((s) => s.wishlist.includes(product.id))
  const [volIndex, setVolIndex] = React.useState(0)
  const [qty, setQty] = React.useState(1)

  const volume = product.volumes[volIndex]
  const discount = discountPercent(volume.price, product.compareAtPrice)

  const handleAdd = () => {
    addToCart(product, volume, qty)
    toast.success('Added to cart', {
      description: `${product.brand} ${product.name} · ${volume.ml}ml${qty > 1 ? ` × ${qty}` : ''}`,
    })
  }

  const handleWishlist = () => {
    toggleWishlist(product.id)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', {
      description: `${product.brand} ${product.name}`,
    })
  }

  return (
    <div className="mt-8">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="font-display text-3xl font-semibold">
          {formatPrice(volume.price)}
        </span>
        {product.compareAtPrice && (
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(product.compareAtPrice)}
          </span>
        )}
        {discount > 0 && (
          <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
            -{discount}%
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{formatKHR(volume.price)}</p>

      {/* Volume selector */}
      <div className="mt-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Size
        </p>
        <div className="flex flex-wrap gap-2">
          {product.volumes.map((v, i) => (
            <button
              key={v.ml}
              onClick={() => setVolIndex(i)}
              className={cn(
                'rounded-lg border px-4 py-2.5 text-sm transition-colors',
                i === volIndex
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-foreground hover:border-foreground/40'
              )}
            >
              {v.ml}ml
              <span className="ml-2 text-xs opacity-70">{formatPrice(v.price)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Qty + actions */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-border">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-12 w-12 place-items-center text-muted-foreground hover:text-foreground"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="grid h-12 w-12 place-items-center text-muted-foreground hover:text-foreground"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={handleAdd}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-foreground py-3.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground active:scale-[0.99]"
        >
          <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
          Add to Cart · {formatPrice(volume.price * qty)}
        </button>
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className="grid h-12 w-12 place-items-center rounded-lg border border-border transition-colors hover:border-foreground/40"
        >
          <Heart
            className={cn('h-4 w-4', wishlisted ? 'fill-danger text-danger' : 'text-foreground')}
            strokeWidth={1.5}
          />
        </button>
      </div>

      {/* Trust badges */}
      <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} /> Free PP delivery over $100
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} /> 100% authentic
        </div>
      </div>
    </div>
  )
}

export const ProductActions = Actions
export const ProductPerfBars = PerfBars

