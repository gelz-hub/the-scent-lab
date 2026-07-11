import { ProductListingSkeleton } from '@/components/site/skeletons'

export default function BrandDetailLoading() {
  return (
    <div>
      <section className="border-b border-border bg-surface/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-3 w-32 animate-pulse rounded bg-surface" />
          <div className="mt-3 h-14 w-64 animate-pulse rounded bg-surface sm:h-16" />
          <div className="mt-4 h-5 w-72 animate-pulse rounded bg-surface" />
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="h-3 w-48 animate-pulse rounded bg-surface" />
        <div className="mt-10 mb-8 h-4 w-56 animate-pulse rounded bg-surface" />
        <ProductListingSkeleton />
      </div>
    </div>
  )
}
