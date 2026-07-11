import { ProductListingSkeleton } from '@/components/site/skeletons'

export default function CollectionDetailLoading() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="relative aspect-[21/9] w-full animate-pulse bg-surface" />
      </section>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="h-3 w-56 animate-pulse rounded bg-surface" />
        <div className="mb-10 mt-6 h-4 w-full max-w-2xl animate-pulse rounded bg-surface" />
        <ProductListingSkeleton />
      </div>
    </div>
  )
}
