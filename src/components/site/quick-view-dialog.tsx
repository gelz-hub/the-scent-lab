'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Heart, Minus, Plus, ShoppingBag, Check, Truck, ShieldCheck } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatPrice, discountPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { StarRating } from './star-rating'
import { toast } from 'sonner'
import type { Season } from '@/lib/data'

const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter']

function PerfBars({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 w-6 rounded-full',
              i <= value ? 'bg-brand' : 'bg-border'
            )}
          />
        ))}
      </div>
    </div>
  )
}

export function QuickViewDialog() {
  const quick = useStore((s) => s.quickView)
  const setQuickView = useStore((s) => s.setQuickView)
  const addToCart = useStore((s) => s.addToCart)
  const toggleWishlist = useStore((s) => s.toggleWishlist)
  const wishlisted = useStore((s) =>
    quick ? s.wishlist.includes(quick.product.id) : false
  )
  const [volIndex, setVolIndex] = React.useState(0)
  const [qty, setQty] = React.useState(1)

  React.useEffect(() => {
    if (quick) {
      setVolIndex(quick.volumeIndex)
      setQty(1)
    }
  }, [quick])

  const product = quick?.product
  const open = !!product

  const handleAdd = () => {
    if (!product) return
    addToCart(product, product.volumes[volIndex], qty)
    toast.success('Added to cart', {
      description: `${product.brand} ${product.name} · ${product.volumes[volIndex].ml}ml × ${qty}`,
    })
    setQuickView(null)
  }

  const handleWishlist = () => {
    if (!product) return
    toggleWishlist(product.id)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setQuickView(null)}>
      <DialogContent className="max-w-4xl overflow-y-auto rounded-xl border-border p-0 sm:max-w-4xl">
        {product && (
          <>
            <DialogTitle className="sr-only">
              {product.brand} {product.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {product.description}
            </DialogDescription>
            <div className="grid gap-0 md:grid-cols-2">
              {/* Image */}
              <div className="relative aspect-square bg-surface md:aspect-auto">
                <Image
                  src={product.image}
                  alt={`${product.brand} ${product.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-8"
                />
                <div className="absolute left-4 top-4 flex flex-col gap-1.5">
                  {product.tags.includes('New') && (
                    <span className="rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider backdrop-blur">
                      New
                    </span>
                  )}
                  {product.compareAtPrice && (
                    <span className="rounded-full bg-danger px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                      -{discountPercent(product.volumes[0].price, product.compareAtPrice)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col p-6 sm:p-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {product.brand}
                </p>
                <h2 className="mt-1 font-display text-2xl font-medium leading-tight sm:text-3xl">
                  {product.name}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={product.rating} size={14} showValue count={product.reviewCount} />
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">
                    {formatPrice(product.volumes[volIndex].price)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>

                {/* Availability */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      product.stock > 0 ? 'bg-success' : 'bg-danger'
                    )}
                  />
                  {product.stock > 0 ? (
                    <span>In stock · {product.stock} ready to ship</span>
                  ) : (
                    <span>Out of stock</span>
                  )}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>

                {/* Volume selector */}
                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Size
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.volumes.map((v, i) => (
                      <button
                        key={v.ml}
                        onClick={() => setVolIndex(i)}
                        className={cn(
                          'rounded-lg border px-4 py-2 text-sm transition-colors',
                          i === volIndex
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border text-foreground hover:border-foreground/40'
                        )}
                      >
                        {v.ml}ml
                        <span className="ml-2 text-xs opacity-70">
                          {formatPrice(v.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Qty + actions */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{qty}</span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={handleAdd}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-foreground py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground active:scale-[0.99]"
                  >
                    <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                    Add to Cart · {formatPrice(product.volumes[volIndex].price * qty)}
                  </button>
                  <button
                    onClick={handleWishlist}
                    aria-label="Toggle wishlist"
                    className="grid h-12 w-12 place-items-center rounded-lg border border-border transition-colors hover:border-foreground/40"
                  >
                    <Heart
                      className={cn(
                        'h-4 w-4',
                        wishlisted ? 'fill-danger text-danger' : 'text-foreground'
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>

                {/* Trust badges */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} /> Free shipping over $100
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} /> 100% authentic
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-6 border-t border-border pt-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Fragrance Pyramid
                  </p>
                  <div className="mt-3 space-y-3">
                    {([
                      ['Top Notes', product.notes.top],
                      ['Heart Notes', product.notes.heart],
                      ['Base Notes', product.notes.base],
                    ] as const).map(([label, notes]) => (
                      <div key={label} className="flex gap-3">
                        <span className="w-24 shrink-0 text-xs text-muted-foreground">
                          {label}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {notes.map((n) => (
                            <span
                              key={n}
                              className="rounded-full bg-surface px-2.5 py-1 text-xs text-foreground"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance */}
                <div className="mt-5 border-t border-border pt-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Performance
                  </p>
                  <div className="space-y-2">
                    <PerfBars label="Longevity" value={product.longevity} />
                    <PerfBars label="Projection" value={product.projection} />
                    <PerfBars label="Sillage" value={product.sillage} />
                  </div>
                </div>

                {/* Meta */}
                <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-5 text-xs">
                  {[
                    ['Gender', product.gender],
                    ['Type', product.category],
                    ['Origin', product.country],
                    ['Launched', String(product.year)],
                    [
                      'Season',
                      product.seasons.join(', '),
                    ],
                    ['Occasion', product.occasions.join(', ')],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-border/60 pb-2">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-right font-medium text-foreground">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Reviews preview */}
                {product.reviews.length > 0 && (
                  <div className="mt-5 border-t border-border pt-5">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Customer Reviews
                    </p>
                    <div className="space-y-3">
                      {product.reviews.slice(0, 2).map((r) => (
                        <div key={r.id} className="rounded-lg bg-surface p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{r.author}</span>
                            <StarRating rating={r.rating} size={11} />
                          </div>
                          <p className="mt-1 text-xs font-medium text-foreground">{r.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{r.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
