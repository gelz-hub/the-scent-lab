import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { ProductListing } from '@/components/site/product-listing'
import { EmptyState } from '@/components/site/empty-state'
import { getCategory, getCategories, getProducts, getBrands, getCollections } from '@/lib/catalog'
import type { Gender } from '@/lib/data'

// Admin-managed Category records (e.g. "Men's Fragrances") are a
// merchandising label, not the same taxonomy as Product.category (which
// is actually the fragrance *format* — Perfume/EDT/etc). They map onto
// Product.gender instead — match on that first ("women" is checked before
// the bare "men" substring it contains), falling back to a literal
// category-field match for any category name that isn't gender-based.
function matchGender(categoryName: string): Gender | null {
  const normalized = categoryName.toLowerCase()
  if (normalized.includes('women')) return 'Women'
  if (normalized.includes('unisex')) return 'Unisex'
  if (normalized.includes('men')) return 'Men'
  return null
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) return { title: 'Category not found' }
  return {
    title: category.name,
    description: category.description,
  }
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [category, allProducts, brands, categories, collections] = await Promise.all([
    getCategory(slug),
    getProducts(),
    getBrands(),
    getCategories(),
    getCollections(),
  ])
  // Invalid/unknown slug (including any leftover malformed links) falls
  // through to the app's not-found page rather than crashing.
  if (!category) notFound()

  const gender = matchGender(category.name)
  const categoryProducts = gender
    ? allProducts.filter((p) => p.gender === gender)
    : allProducts.filter((p) => p.category.toLowerCase() === category.name.toLowerCase())

  return (
    <div>
      <section className="border-b border-border bg-surface/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="font-display text-5xl font-medium tracking-tight sm:text-6xl md:text-7xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-4 max-w-2xl font-display text-xl font-light italic text-muted-foreground">
              {category.description}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: category.name },
          ]}
        />

        <div className="mb-8">
          <h2 className="font-display text-2xl font-medium">Fragrances</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {categoryProducts.length} {categoryProducts.length === 1 ? 'fragrance' : 'fragrances'} in {category.name}
          </p>
        </div>
        {categoryProducts.length === 0 ? (
          <EmptyState title="No products available in this category yet." />
        ) : (
          <ProductListing
            basePath={`/categories/${slug}`}
            pageSize={9}
            baseProducts={categoryProducts}
            allBrands={brands}
            genderOptions={categories.map((c) => c.name) as Gender[]}
            collectionOptions={collections.map((c) => c.name)}
          />
        )}
      </div>
    </div>
  )
}
