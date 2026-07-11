import { ProductGridSkeleton } from '@/components/site/skeletons'

export default function HomeLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-0 px-4 sm:px-6 lg:grid-cols-2 lg:min-h-[700px]">
          <div className="order-2 py-14 lg:order-1 lg:py-24 lg:pr-12 xl:pr-20">
            <div className="h-3 w-40 animate-pulse rounded bg-surface" />
            <div className="mt-5 h-16 w-full max-w-md animate-pulse rounded bg-surface sm:h-20" />
            <div className="mt-3 h-16 w-3/4 max-w-sm animate-pulse rounded bg-surface" />
            <div className="mt-6 h-4 w-full max-w-md animate-pulse rounded bg-surface" />
            <div className="mt-8 flex gap-3">
              <div className="h-14 w-40 animate-pulse rounded-xl bg-surface" />
              <div className="h-14 w-44 animate-pulse rounded-xl bg-surface" />
            </div>
          </div>
          <div className="relative order-1 aspect-[4/3] animate-pulse bg-surface lg:order-2 lg:aspect-auto lg:h-[700px]" />
        </div>
      </section>

      {/* Section skeleton */}
      <div className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <div className="h-3 w-24 animate-pulse rounded bg-surface" />
            <div className="mt-2 h-8 w-56 animate-pulse rounded bg-surface" />
          </div>
          <ProductGridSkeleton count={4} />
        </div>
      </div>
    </>
  )
}
