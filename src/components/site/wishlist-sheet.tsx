'use client'

import Image from 'next/image'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Heart, ShoppingBag, X, Share2 } from 'lucide-react'
import * as React from 'react'
import { useStore } from '@/lib/store'
import type { Product } from '@/lib/data'
import { formatPrice } from '@/lib/format'
import { toast } from 'sonner'
import { StarRating } from './star-rating'

export function WishlistSheet() {
  const wishlist = useStore((s) => s.wishlist)
  const open = useStore((s) => s.wishlistOpen)
  const setOpen = useStore((s) => s.setWishlistOpen)
  const toggleWishlist = useStore((s) => s.toggleWishlist)
  const hydrateWishlist = useStore((s) => s.hydrateWishlist)
  const addToCart = useStore((s) => s.addToCart)
  const [products, setProducts] = React.useState<Product[]>([])
  const [productsLoaded, setProductsLoaded] = React.useState(false)
  const loaded = React.useRef(false)

  React.useEffect(() => {
    if (!open || loaded.current) return
    loaded.current = true
    fetch('/api/products?status=ACTIVE&visibility=PUBLIC')
      .then((res) => res.json())
      .then((data: { products?: Product[] }) => {
        setProducts(data.products ?? [])
        setProductsLoaded(true)
      })
      .catch(() => {})
  }, [open])

  const items = products.filter((p) => wishlist.includes(p.id))

  // Prune wishlist entries whose product no longer exists/is no longer
  // public (e.g. deleted from admin) once we know the real catalog — even
  // an empty catalog is a valid "known state" that should clear a stale
  // wishlist, so this checks productsLoaded rather than products.length.
  React.useEffect(() => {
    if (!productsLoaded || wishlist.length === 0) return
    const validIds = new Set(products.map((p) => p.id))
    const stale = wishlist.filter((id) => !validIds.has(id))
    if (stale.length > 0) {
      hydrateWishlist(wishlist.filter((id) => validIds.has(id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productsLoaded, products])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `${typeof window !== 'undefined' ? window.location.origin : ''}/?wishlist=${wishlist.join(',')}`
      )
      toast.success('Wishlist link copied', { description: 'Share it with anyone' })
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 border-border p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 font-display text-xl">
            <Heart className="h-4 w-4" strokeWidth={1.5} />
            Wishlist
            <span className="text-sm font-sans font-normal text-muted-foreground">
              ({items.length})
            </span>
          </SheetTitle>
          {items.length > 0 && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Share
            </button>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-surface">
              <Heart className="h-6 w-6 text-muted-foreground" strokeWidth={1.2} />
            </div>
            <p className="font-display text-lg">No favorites yet</p>
            <p className="text-sm text-muted-foreground">
              Tap the heart on any fragrance to save it here.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              Explore fragrances
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-3">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="group flex gap-3 rounded-lg border border-border p-3"
                >
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-surface">
                    <Image
                      src={p.image}
                      alt={`${p.brand} ${p.name}`}
                      fill
                      sizes="80px"
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.brand}
                        </p>
                        <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                        <div className="mt-0.5">
                          <StarRating rating={p.rating} size={11} showValue />
                        </div>
                      </div>
                      <button
                        onClick={() => toggleWishlist(p.id)}
                        aria-label="Remove from wishlist"
                        className="text-muted-foreground transition-colors hover:text-danger"
                      >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {formatPrice(p.volumes[0].price)}
                      </span>
                      <button
                        onClick={() => {
                          addToCart(p, p.volumes[0], 1)
                          toast.success('Moved to cart', {
                            description: `${p.brand} ${p.name}`,
                          })
                        }}
                        className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
                      >
                        <ShoppingBag className="h-3 w-3" strokeWidth={1.5} />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
