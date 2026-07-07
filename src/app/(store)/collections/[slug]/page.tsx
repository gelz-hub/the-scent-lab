import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { ProductListing } from '@/components/site/product-listing'
import { collectionBySlug, collectionDetails, productsForCollection } from '@/lib/data'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return collectionDetails.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const collection = collectionBySlug(slug)
  if (!collection) return { title: 'Collection not found' }
  return {
    title: collection.name,
    description: collection.longDescription,
  }
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { slug } = await params
  const collection = collectionBySlug(slug)
  if (!collection) notFound()

  const products = productsForCollection(slug)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="relative aspect-[21/9] w-full">
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
              {collection.tagline}
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-white sm:text-5xl md:text-6xl">
              {collection.name}
            </h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Collections', href: '/collections' },
            { label: collection.name },
          ]}
        />

        <div className="mb-10 max-w-2xl">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {collection.longDescription}
          </p>
        </div>

        <ProductListing basePath={`/collections/${slug}`} pageSize={9} baseProducts={products} />
      </div>
    </div>
  )
}
