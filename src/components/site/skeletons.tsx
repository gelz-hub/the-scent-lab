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

/** Breadcrumb + eyebrow + title + subtitle — the header block repeated at the top of most storefront pages. */
export function PageHeaderSkeleton({ withSubtitle = true }: { withSubtitle?: boolean }) {
  return (
    <div className="mb-8">
      <div className="h-3 w-32 animate-pulse rounded bg-surface" />
      <div className="mt-4 h-3 w-24 animate-pulse rounded bg-surface" />
      <div className="mt-2 h-9 w-64 animate-pulse rounded bg-surface sm:h-11 sm:w-80" />
      {withSubtitle && <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-surface" />}
    </div>
  )
}

/** Matches ProductListing's [240px sidebar | grid] layout so the filter rail doesn't pop in after the grid. */
export function ProductListingSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="space-y-7">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="mb-3 h-3 w-20 animate-pulse rounded bg-surface" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 w-full animate-pulse rounded bg-surface" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div className="h-4 w-28 animate-pulse rounded bg-surface" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-surface" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function BrandCardSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-8">
      <div className="h-6 w-32 animate-pulse rounded bg-surface" />
      <div className="h-3 w-24 animate-pulse rounded bg-surface" />
      <div className="mt-2 h-3 w-40 animate-pulse rounded bg-surface" />
      <div className="mt-3 h-3 w-20 animate-pulse rounded bg-surface" />
    </div>
  )
}

export function BrandGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BrandCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CollectionCardSkeleton() {
  return <div className="aspect-[4/5] animate-pulse rounded-xl bg-surface" />
}

export function CollectionGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CollectionCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Product detail page — gallery + info column, matching product/[slug]/page.tsx's two-column layout. */
export function ProductDetailSkeleton() {
  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="h-3 w-56 animate-pulse rounded bg-surface" />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <div className="aspect-square animate-pulse rounded-xl bg-surface" />
            <div className="mt-3 grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-surface" />
              ))}
            </div>
          </div>
          <div className="lg:pt-2">
            <div className="h-3 w-24 animate-pulse rounded bg-surface" />
            <div className="mt-3 h-9 w-3/4 animate-pulse rounded bg-surface" />
            <div className="mt-3 h-4 w-32 animate-pulse rounded bg-surface" />
            <div className="mt-5 h-4 w-full animate-pulse rounded bg-surface" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-surface" />
            <div className="mt-5 h-24 w-full animate-pulse rounded-lg bg-surface" />
            <div className="mt-5 grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-surface" />
              ))}
            </div>
            <div className="mt-5 h-12 w-full animate-pulse rounded-lg bg-surface" />
          </div>
        </div>
      </div>
    </div>
  )
}
