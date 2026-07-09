import { formatPrice, formatKHR } from '@/lib/format'
import { cn } from '@/lib/utils'

interface DualPriceProps {
  amount: number
  className?: string
  khrClassName?: string
  /** 'stacked' puts KHR on its own line beneath USD; 'inline' joins them with a dot. */
  layout?: 'stacked' | 'inline'
}

export function DualPrice({ amount, className, khrClassName, layout = 'stacked' }: DualPriceProps) {
  if (layout === 'inline') {
    return (
      <span className={className}>
        {formatPrice(amount)}
        <span className={cn('text-muted-foreground', khrClassName)}> · {formatKHR(amount)}</span>
      </span>
    )
  }

  return (
    <span className="inline-flex flex-col">
      <span className={className}>{formatPrice(amount)}</span>
      <span className={cn('text-[11px] text-muted-foreground', khrClassName)}>{formatKHR(amount)}</span>
    </span>
  )
}
