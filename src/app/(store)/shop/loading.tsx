import { PageHeaderSkeleton, ProductListingSkeleton } from '@/components/site/skeletons'

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <PageHeaderSkeleton />
      <ProductListingSkeleton />
    </div>
  )
}
