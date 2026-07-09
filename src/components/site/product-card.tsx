'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Product } from '@/lib/data'
import { formatPrice, discountPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { StarRating } from './star-rating'
import { WishlistButton } from './wishlist-button'
import { AddToCartButton } from './add-to-cart-button'
import { DualPrice } from './dual-price'

interface ProductCardProps {
  product: Product
  index?: number
  className?: string
}

export function ProductCard({
  product,
  index = 0,
  className,
}: ProductCardProps) {
  const firstVolume = product.volumes[0]
  const discount = discountPercent(firstVolume.price, product.compareAtPrice)
  const onSale = product.tags.includes('Sale')

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.06, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-foreground/20',
        className,
      )}
    >
      {/* ── Image wrapper ─────────────────────── */}
      <div className="relative block aspect-square overflow-hidden rounded-t-2xl bg-surface">
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 h-full w-full"
          aria-label={`View ${product.brand} ${product.name}`}
        >
          <Image
            src={product.image}
            alt={`${product.brand} ${product.name}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-5 transition-transform duration-700 ease-out-expo group-hover:scale-[1.06]"
          />

          {/* ── Badges ────────────────────────── */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.tags.includes('New') && (
              <span className="rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground shadow-sm backdrop-blur">
                New
              </span>
            )}
            {onSale && discount > 0 && (
              <span className="rounded-full bg-danger px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white shadow-sm">
                -{discount}%
              </span>
            )}
            {product.tags.includes('Bestseller') &&
              !product.tags.includes('New') && (
                <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-background shadow-sm">
                  Bestseller
                </span>
              )}
          </div>

          {/* ── View product reveal ─────────────── */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 ease-out-spring group-hover:translate-y-0 group-hover:opacity-100">
            <span className="pointer-events-none flex items-center justify-center gap-2 rounded-xl bg-background/95 py-2.5 text-xs font-medium tracking-wide shadow-sm backdrop-blur">
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
              View Product
            </span>
          </div>
        </Link>

        {/* ── Wishlist ────────────────────────── */}
        <WishlistButton
          productId={product.id}
          productName={`${product.brand} ${product.name}`}
          className="absolute right-3 top-3 z-10"
        />
      </div>

      {/* ── Info ─────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/brands/${product.brandSlug}`}
          className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors duration-200 hover:text-brand"
        >
          {product.brand}
        </Link>
        <Link
          href={`/product/${product.slug}`}
          className="mt-1 line-clamp-1 text-[15px] font-medium text-foreground transition-colors duration-200 hover:text-brand"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <StarRating
            rating={product.rating}
            size={12}
            showValue
            count={product.reviewCount}
          />
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[13px] text-muted-foreground">
              {firstVolume.ml}ml · {product.category}
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <DualPrice
                amount={firstVolume.price}
                className="text-[15px] font-semibold text-foreground"
              />
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Add to cart ─────────────────────── */}
        <AddToCartButton product={product} volume={firstVolume} />
      </div>
    </motion.article>
  )
}
