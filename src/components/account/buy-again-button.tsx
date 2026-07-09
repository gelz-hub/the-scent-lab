'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { RotateCcw, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'

interface BuyAgainItem {
  productId: string
  slug: string | null
  name: string
  brand: string
  image: string
  ml: number
  qty: number
  price: number
  available: boolean
  reason?: string
}

/** Adds a previous order's items to the cart using CURRENT price/availability — never the historical order price. */
export function BuyAgainButton({ orderId, className }: { orderId: string; className?: string }) {
  const [loading, setLoading] = React.useState(false)
  const addCartLine = useStore((s) => s.addCartLine)
  const setCartOpen = useStore((s) => s.setCartOpen)

  async function handleBuyAgain() {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/buy-again`)
      const data: { items: BuyAgainItem[]; unavailableCount: number } = await res.json()
      if (!res.ok) {
        toast.error('Could not load this order.')
        return
      }

      const available = data.items.filter((i) => i.available)
      for (const item of available) {
        addCartLine(
          {
            productId: item.productId,
            slug: item.slug ?? '',
            name: item.name,
            brand: item.brand,
            image: item.image,
            volume: { ml: item.ml, price: item.price },
          },
          item.qty
        )
      }

      if (available.length === 0) {
        toast.error('None of these items are currently available.')
        return
      }

      setCartOpen(true)
      toast.success(
        data.unavailableCount > 0
          ? `${available.length} item(s) added — ${data.unavailableCount} no longer available.`
          : `${available.length} item(s) added to your cart at current prices.`
      )
    } catch {
      toast.error('Could not add these items to your cart.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleBuyAgain}
      disabled={loading}
      className={className ?? 'flex items-center gap-1.5 text-xs font-medium text-brand hover:underline disabled:opacity-50'}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />}
      Buy again
    </button>
  )
}
