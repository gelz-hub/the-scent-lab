'use client'

import * as React from 'react'
import Link from 'next/link'
import { Share2, Heart } from 'lucide-react'
import { useStore } from '@/lib/store'
import { products } from '@/lib/data'
import { ProductCard } from '@/components/site/product-card'
import { EmptyState } from '@/components/site/empty-state'
import { toast } from 'sonner'

export default function WishlistPage() {
  const wishlist = useStore((s) => s.wishlist)
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch — wishlist is persisted client-side.
  React.useEffect(() => setMounted(true), [])

  const items = products.filter((p) => wishlist.includes(p.id))

  const handleShare = async () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/account/wishlist`
        : ''
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Scent Lab wishlist',
          text: 'Check out my favourite fragrances from The Scent Lab.',
          url,
        })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Wishlist link copied', {
        description: 'Share it with anyone you like.',
      })
    } catch {
      toast.error('Could not copy link', {
        description: 'Please copy the URL from your browser.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            Saved for later
          </p>
          <h2 className="mt-1.5 font-display text-3xl font-medium tracking-tight">
            Your wishlist
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mounted
              ? `${items.length} ${items.length === 1 ? 'fragrance' : 'fragrances'} saved`
              : 'Loading your wishlist…'}
          </p>
        </div>
        {mounted && items.length > 0 && (
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium transition-colors hover:border-foreground/40"
          >
            <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Share wishlist
          </button>
        )}
      </div>

      {!mounted ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Tap the heart on any fragrance to save it here for later. Your saved picks make gifting (and treating yourself) effortless."
          actionLabel="Browse fragrances"
          actionHref="/shop"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}

      {mounted && items.length > 0 && (
        <div className="flex items-center justify-center pt-4">
          <Link
            href="/shop"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Heart className="h-4 w-4" strokeWidth={1.5} />
            Continue discovering fragrances
          </Link>
        </div>
      )}
    </div>
  )
}
