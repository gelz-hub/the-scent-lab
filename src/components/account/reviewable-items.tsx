'use client'

import * as React from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { WriteReviewDialog } from './write-review-dialog'

interface ReviewableItem {
  id: string
  name: string
  brand: string
  image: string
  order: { orderNumber: string }
}

/** Delivered order items the customer hasn't reviewed yet — reviews only ever open from here, enforcing "delivered only, one per order item" at the UI level too (the API enforces it for real). */
export function ReviewableItems() {
  const [items, setItems] = React.useState<ReviewableItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [reviewing, setReviewing] = React.useState<ReviewableItem | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reviews/reviewable')
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      toast.error('Could not load reviewable items')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  if (loading || items.length === 0) return null

  return (
    <section>
      <h3 className="mb-3 font-display text-lg font-medium">Write a review</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setReviewing(item)}
            className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-foreground/30"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface">
              <Image src={item.image} alt={item.name} fill sizes="48px" className="object-contain p-1" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">From order {item.order.orderNumber}</p>
            </div>
            <Star className="h-4 w-4 shrink-0 text-brand" strokeWidth={1.5} />
          </button>
        ))}
      </div>

      <WriteReviewDialog
        orderItemId={reviewing?.id ?? null}
        productName={reviewing?.name ?? ''}
        open={!!reviewing}
        onOpenChange={(open) => !open && setReviewing(null)}
        onSubmitted={load}
      />
    </section>
  )
}
