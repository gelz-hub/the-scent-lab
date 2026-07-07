'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  size?: number
  className?: string
  showValue?: boolean
  count?: number
}

export function StarRating({
  rating,
  size = 14,
  className,
  showValue = false,
  count,
}: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = rating >= i
          const half = !filled && rating >= i - 0.5
          return (
            <Star
              key={i}
              width={size}
              height={size}
              className={cn(
                'text-foreground',
                filled || half ? 'fill-foreground' : 'fill-transparent'
              )}
              strokeWidth={1.5}
            />
          )
        })}
      </div>
      {showValue && (
        <span className="text-xs text-muted-foreground">
          {rating.toFixed(1)}
          {typeof count === 'number' && (
            <span className="ml-1">({count.toLocaleString()})</span>
          )}
        </span>
      )}
    </div>
  )
}
