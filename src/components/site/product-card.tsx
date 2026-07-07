'use client'

import * as React from 'react'
import Image from 'next/image'
import { Heart, Eye, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Product } from '@/lib/data'
import { useStore } from '@/lib/store'
import { formatPrice, discountPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { StarRating } from './star-rating'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  index?: number
  className?: string
}

export function ProductCard({ product, index = 0, className }: ProductCardProps) {
  const addToCart = useStore((s) => s.addToCart)
  const toggleWishlist = useStore((s) => s.toggleWishlist)
  const isWishlisted = useStore((s) => s.wishlist.includes(product.id))
  const setQuickView = useStore((s) => s.setQuickView)

  const firstVolume = product.volumes[0]
  const discount = discountPercent(firstVolume.price, product.compareAtPrice)
  const onSale = product.tags.includes('Sale')

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleWishlist(product.id)
    toast.success(
      isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      { description: `${product.brand} ${product.name}` }
    )
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation()
    setQuickView({ product, volumeIndex: 0 })
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart(product, firstVolume, 1)
    toast.success('Added to cart', {
      description: `${product.brand} ${product.name} · ${firstVolume.ml}ml`,
    })
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative flex flex-col rounded-xl border border-border bg-card transition-colors duration-200 hover:border-foreground/25',
        className
      )}
    >
      {/* Image wrapper */}
      <div className="relative block aspect-square overflow-hidden rounded-t-xl bg-surface">
        <button
          onClick={handleQuickView}
          className="absolute inset-0 h-full w-full"
          aria-label={`Quick view ${product.name}`}
        >
          <Image
            src={product.image}
            alt={`${product.brand} ${product.name}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.tags.includes('New') && (
              <span className="rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground backdrop-blur">
                New
              </span>
            )}
            {onSale && discount > 0 && (
              <span className="rounded-full bg-danger px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                -{discount}%
              </span>
            )}
            {product.tags.includes('Bestseller') && !product.tags.includes('New') && (
              <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-background">
                Bestseller
              </span>
            )}
          </div>

          {/* Quick view */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="pointer-events-none flex items-center justify-center gap-2 rounded-lg bg-background/95 py-2.5 text-xs font-medium tracking-wide backdrop-blur">
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
              Quick View
            </span>
          </div>
        </button>

        {/* Wishlist (sibling, not nested) */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/90 backdrop-blur transition-all duration-200 hover:scale-105',
            'opacity-0 group-hover:opacity-100 max-md:opacity-100'
          )}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              isWishlisted ? 'fill-danger text-danger' : 'text-foreground'
            )}
            strokeWidth={1.5}
          />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {product.brand}
        </p>
        <h3 className="mt-1 line-clamp-1 text-[15px] font-medium text-foreground">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <StarRating rating={product.rating} size={12} showValue count={product.reviewCount} />
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[13px] text-muted-foreground">
              {firstVolume.ml}ml · {product.category}
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-[15px] font-semibold text-foreground">
                {formatPrice(firstVolume.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-foreground py-2.5 text-xs font-medium tracking-wide text-background transition-all duration-200 hover:bg-brand hover:text-brand-foreground active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Add to Cart
        </button>
      </div>
    </motion.article>
  )
}
