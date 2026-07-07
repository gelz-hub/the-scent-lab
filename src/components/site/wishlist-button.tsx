'use client'

import { Heart } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface WishlistButtonProps {
  productId: string
  productName?: string
  className?: string
  variant?: 'icon' | 'pill'
}

export function WishlistButton({
  productId,
  productName,
  className,
  variant = 'icon',
}: WishlistButtonProps) {
  const wishlisted = useStore((s) => s.wishlist.includes(productId))
  const toggle = useStore((s) => s.toggleWishlist)

  const handle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(productId)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', {
      description: productName,
    })
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={handle}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className={cn(
          'flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-foreground/40',
          wishlisted && 'border-danger/40 text-danger',
          className
        )}
      >
        <Heart
          className={cn('h-4 w-4', wishlisted && 'fill-danger text-danger')}
          strokeWidth={1.5}
        />
        {wishlisted ? 'Saved' : 'Wishlist'}
      </button>
    )
  }

  return (
    <button
      onClick={handle}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-full bg-background/90 backdrop-blur transition-all duration-200 hover:scale-105',
        'opacity-0 group-hover:opacity-100 max-md:opacity-100',
        className
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-colors',
          wishlisted ? 'fill-danger text-danger' : 'text-foreground'
        )}
        strokeWidth={1.5}
      />
    </button>
  )
}
