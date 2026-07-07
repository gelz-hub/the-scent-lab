'use client'

import { Plus, ShoppingBag } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { Product, VolumeOption } from '@/lib/data'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/format'

interface AddToCartButtonProps {
  product: Product
  volume: VolumeOption
  qty?: number
  variant?: 'card' | 'detail'
  className?: string
  children?: React.ReactNode
}

export function AddToCartButton({
  product,
  volume,
  qty = 1,
  variant = 'card',
  className,
  children,
}: AddToCartButtonProps) {
  const addToCart = useStore((s) => s.addToCart)

  const handle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, volume, qty)
    toast.success('Added to cart', {
      description: `${product.brand} ${product.name} · ${volume.ml}ml${qty > 1 ? ` × ${qty}` : ''}`,
    })
  }

  if (variant === 'detail') {
    return (
      <button
        onClick={handle}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-lg bg-foreground py-3.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground active:scale-[0.99]',
          className
        )}
      >
        <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
        {children ?? `Add to Cart · ${formatPrice(volume.price * qty)}`}
      </button>
    )
  }

  return (
    <button
      onClick={handle}
      className={cn(
        'mt-4 flex items-center justify-center gap-2 rounded-lg bg-foreground py-2.5 text-xs font-medium tracking-wide text-background transition-all duration-200 hover:bg-brand hover:text-brand-foreground active:scale-[0.98]',
        className
      )}
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      Add to Cart
    </button>
  )
}
