import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ORDER_STATUS_STEPS, type OrderStatusValue } from '@/lib/checkout/constants'

interface OrderStatusTimelineProps {
  status: OrderStatusValue
  className?: string
}

export function OrderStatusTimeline({ status, className }: OrderStatusTimelineProps) {
  if (status === 'CANCELLED') {
    return (
      <div className={cn('flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger', className)}>
        <X className="h-4 w-4" strokeWidth={2} />
        This order was cancelled.
      </div>
    )
  }

  const currentIndex = ORDER_STATUS_STEPS.findIndex((s) => s.value === status)

  return (
    <div className={cn('flex flex-col gap-0 sm:flex-row sm:items-start', className)}>
      {ORDER_STATUS_STEPS.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        const isLast = i === ORDER_STATUS_STEPS.length - 1

        return (
          <div key={step.value} className="flex flex-1 sm:flex-col">
            <div className="flex flex-col items-center sm:w-full">
              <div className="flex w-full items-center sm:contents">
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-medium transition-colors',
                    done && 'border-brand bg-brand text-brand-foreground',
                    active && 'border-brand text-brand',
                    !done && !active && 'border-border text-muted-foreground'
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                </span>
                {!isLast && (
                  <span
                    className={cn(
                      'mx-2 h-px flex-1 sm:hidden',
                      done ? 'bg-brand' : 'bg-border'
                    )}
                  />
                )}
              </div>
              {!isLast && (
                <span className={cn('mt-1.5 hidden h-px w-full sm:block', done ? 'bg-brand' : 'bg-border')} />
              )}
            </div>
            <p className={cn(
              'mt-1.5 pb-4 text-xs sm:pb-0 sm:text-center',
              active ? 'font-medium text-foreground' : done ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
