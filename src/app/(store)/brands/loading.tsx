import { PageHeaderSkeleton, BrandGridSkeleton } from '@/components/site/skeletons'

export default function BrandsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <PageHeaderSkeleton />
      <BrandGridSkeleton />
    </div>
  )
}
