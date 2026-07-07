import { cn } from '@/lib/utils'

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col rounded-xl border border-border bg-card', className)}>
      <div className="aspect-square animate-pulse rounded-t-xl bg-surface" />
      <div className="flex flex-1 flex-col p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-surface" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-surface" />
        <div className="mt-2 h-3 w-24 animate-pulse rounded bg-surface" />
        <div className="mt-4 h-4 w-16 animate-pulse rounded bg-surface" />
        <div className="mt-4 h-9 animate-pulse rounded-lg bg-surface" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
