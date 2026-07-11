import { ProductGridSkeleton } from '@/components/site/skeletons'

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="h-3 w-24 animate-pulse rounded bg-surface" />
      <div className="mb-6 mt-3 h-9 w-32 animate-pulse rounded bg-surface" />
      <div className="h-14 w-full animate-pulse rounded-xl bg-surface" />
      <div className="mt-8">
        <div className="mb-6 h-4 w-40 animate-pulse rounded bg-surface" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  )
}
